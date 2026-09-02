// Vercel Serverless Function — 스레드 자동 발행 (크론이 매일 호출)
// threads/queue.json 의 대기열에서, 아직 내 계정에 올라가지 않은 첫 글을 찾아 발행합니다.
// 이미 올라간 글인지는 스레드 API로 내 최근 글을 읽어 본문을 비교해 판단하므로
// 별도 상태 저장이 필요 없고, 하루 실패해도 다음 호출 때 같은 글을 다시 시도합니다.
//
// 필요한 환경변수 (Vercel 프로젝트 Settings → Environment Variables):
//   THREADS_ACCESS_TOKEN  스레드 장기 액세스 토큰 (60일마다 갱신 필요)
//   CRON_SECRET           임의의 긴 문자열 — 설정하면 크론 외 호출을 차단합니다 (강력 권장)
//
// 미리보기: GET /api/post-thread?check=1  → 발행하지 않고 다음 발행 예정 글만 보여줍니다.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const API = process.env.THREADS_API_BASE || "https://graph.threads.net/v1.0";
const normalize = (s) => (s ?? "").replace(/\s+/g, " ").trim();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Vercel 크론은 CRON_SECRET 환경변수가 있으면 Authorization: Bearer <CRON_SECRET> 을 붙여 호출합니다
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "THREADS_ACCESS_TOKEN 환경변수가 없습니다" });

  let queue;
  try {
    queue = JSON.parse(readFileSync(join(process.cwd(), "threads/queue.json"), "utf8")).posts ?? [];
  } catch (e) {
    return res.status(500).json({ error: `threads/queue.json 을 읽지 못했습니다: ${e.message}` });
  }
  if (queue.length === 0) return res.status(200).json({ done: true, message: "대기열이 비어 있습니다" });

  try {
    const me = await threadsGet(`/me?fields=id,username`, token);

    // 내 최근 글 본문을 모아 이미 발행된 항목을 걸러냄
    const recent = await threadsGet(`/${me.id}/threads?fields=text&limit=100`, token);
    const posted = new Set((recent.data ?? []).map((t) => normalize(t.text)));

    const skipped = [];
    let next = null;
    for (const item of queue) {
      const text = (typeof item === "string" ? item : item.text ?? "").trim();
      if (!text || text.length > 500) { skipped.push(firstLine(text) || "(빈 글)"); continue; }
      if (posted.has(normalize(text))) continue;
      next = text;
      break;
    }

    if (!next) {
      return res.status(200).json({
        done: true,
        message: "대기열의 모든 글이 이미 발행되었습니다. threads/queue.json 에 새 글을 채워주세요.",
        ...(skipped.length ? { skippedInvalid: skipped } : {}),
      });
    }

    if (req.query?.check) {
      return res.status(200).json({ wouldPost: next, account: me.username, queueSize: queue.length });
    }

    const creation = await threadsPost(`/${me.id}/threads`, { media_type: "TEXT", text: next }, token);
    const published = await threadsPost(`/${me.id}/threads_publish`, { creation_id: creation.id }, token);

    let permalink = "";
    try {
      permalink = (await threadsGet(`/${published.id}?fields=permalink`, token)).permalink ?? "";
    } catch { /* permalink 조회 실패는 무시 */ }

    return res.status(200).json({ posted: firstLine(next), account: me.username, permalink, mediaId: published.id });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}

const firstLine = (s) => ((s ?? "").split("\n").find((l) => l.trim()) ?? "").slice(0, 40);

async function threadsGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${API}${path}${sep}access_token=${encodeURIComponent(token)}`);
  const json = await r.json();
  if (!r.ok || json.error) throw new Error(json?.error?.message ?? `Threads API 오류 (HTTP ${r.status})`);
  return json;
}

async function threadsPost(path, params, token) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: token })) url.searchParams.set(k, v);
  const r = await fetch(url, { method: "POST" });
  const json = await r.json();
  if (!r.ok || json.error) throw new Error(json?.error?.message ?? `Threads API 오류 (HTTP ${r.status})`);
  return json;
}
