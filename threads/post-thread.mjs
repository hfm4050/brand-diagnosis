// 스레드 글 게시 스크립트 — Threads 공식 API 사용
// 준비: threads/README.md 의 "게시 준비 (액세스 토큰)" 참고. THREADS_ACCESS_TOKEN 환경변수 필요.
//
// 사용법:
//   node threads/post-thread.mjs --list              생성된 카피 목록 보기
//   node threads/post-thread.mjs --pick 3            3번 카피의 v1 게시 (게시 전 미리보기 + 확인)
//   node threads/post-thread.mjs --pick 3 --version v2
//   node threads/post-thread.mjs --text "직접 쓴 글"
//   --yes 를 붙이면 확인 없이 바로 게시합니다.

import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const COPIES = getArg('copies', 'threads/output/copies.json');
const TOKEN = process.env.THREADS_ACCESS_TOKEN || '';
const API = 'https://graph.threads.net/v1.0';

function loadCopies() {
  if (!existsSync(COPIES)) {
    console.error(`카피 파일이 없습니다: ${COPIES} — 먼저 generate-copy.mjs 를 실행하세요.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(COPIES, 'utf8')).items;
}

// --list: 게시할 카피 고르기용 목록
if (hasFlag('list')) {
  for (const item of loadCopies()) {
    const firstLine = (v) => (v ?? '').split('\n').find((l) => l.trim()) ?? '';
    console.log(`#${item.index} ${item.category}`);
    console.log(`   v1: ${firstLine(item.v1)}`);
    console.log(`   v2: ${firstLine(item.v2)}`);
  }
  console.log('\n게시:  node threads/post-thread.mjs --pick <번호> [--version v1|v2]');
  process.exit(0);
}

// 게시할 본문 결정
let text = getArg('text', '');
if (!text) {
  const pick = Number(getArg('pick', '0'));
  if (!pick) {
    console.error('게시할 글을 지정하세요: --pick <번호> 또는 --text "..."  (목록은 --list)');
    process.exit(1);
  }
  const item = loadCopies().find((c) => c.index === pick);
  if (!item) {
    console.error(`#${pick} 카피를 찾지 못했습니다. --list 로 번호를 확인하세요.`);
    process.exit(1);
  }
  text = getArg('version', 'v1') === 'v2' ? item.v2 : item.v1;
}
text = text.trim();

if (!TOKEN) {
  console.error('THREADS_ACCESS_TOKEN 환경변수가 없습니다. threads/README.md 의 토큰 발급 안내를 참고하세요.');
  process.exit(1);
}
if (text.length === 0 || text.length > 500) {
  console.error(`본문이 비었거나 500자를 넘습니다 (현재 ${text.length}자). 스레드는 글당 500자까지입니다.`);
  process.exit(1);
}

async function api(path, params) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json?.error?.message ?? `API 오류 (HTTP ${res.status})`);
  return json;
}

const meRes = await fetch(`${API}/me?fields=id,username&access_token=${encodeURIComponent(TOKEN)}`);
const me = await meRes.json();
if (!meRes.ok || me.error) {
  console.error(`계정 확인 실패: ${me?.error?.message ?? meRes.status} — 토큰이 만료됐다면 README의 갱신 방법을 참고하세요.`);
  process.exit(1);
}

console.log(`@${me.username} 계정으로 아래 글을 게시합니다 (${text.length}자):\n`);
console.log('┄'.repeat(30));
console.log(text);
console.log('┄'.repeat(30));

if (!hasFlag('yes')) {
  await new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\n게시하려면 Enter, 취소는 Ctrl+C: ', () => { rl.close(); resolve(); });
  });
}

const creation = await api(`/${me.id}/threads`, { media_type: 'TEXT', text });
const published = await api(`/${me.id}/threads_publish`, { creation_id: creation.id });

let permalink = '';
try {
  const info = await fetch(`${API}/${published.id}?fields=permalink&access_token=${encodeURIComponent(TOKEN)}`).then((r) => r.json());
  permalink = info.permalink ?? '';
} catch { /* permalink 조회 실패는 무시 */ }

console.log(`\n게시 완료${permalink ? `: ${permalink}` : ` (media id: ${published.id})`}`);
