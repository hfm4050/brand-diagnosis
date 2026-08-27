// 음성 → 글 변환 (OpenAI Whisper). 환경변수 OPENAI_API_KEY 필요.
export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.OPENAI_API_KEY) return res.status(501).json({ error: "음성 변환을 쓰려면 Vercel 환경변수 OPENAI_API_KEY를 추가하세요" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const buf = Buffer.from(body.data, "base64");
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: body.type || "audio/webm" }), body.name || "audio.webm");
    fd.append("model", "whisper-1");
    fd.append("language", "ko");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: fd });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message || "변환 실패" });
    res.status(200).json({ text: d.text });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
