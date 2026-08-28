// Vercel Serverless Function — Anthropic API 프록시
// stream:true 요청은 SSE로 그대로 흘려보내고(504 방지), 일반 요청은 JSON으로 응답합니다.
export const config = { api: { bodyParser: { sizeLimit: "30mb" }, responseLimit: false } };
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST only" } });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY 환경변수가 없습니다" } });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    body.max_tokens = Math.min(body.max_tokens || 3000, 8000);
    const wantStream = body.stream === true;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    if (!wantStream) {
      const t = await r.text();
      res.status(r.status).setHeader("Content-Type", "application/json");
      return res.end(t);
    }
    if (!r.ok) {
      const t = await r.text();
      res.status(r.status).setHeader("Content-Type", "application/json");
      return res.end(t);
    }
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(dec.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: { message: e.message } });
    else res.end();
  }
}
