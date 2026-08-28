// 열정덕 카피 자동 생성 스크립트
// 사용법:
//   ANTHROPIC_API_KEY=sk-ant-... node threads/generate-copy.mjs
//   node threads/generate-copy.mjs --proxy https://프로젝트명.vercel.app/api/claude   (배포된 프록시 사용, 키 불필요)
//
// 옵션:
//   --input threads/output/reposts.json   수집 결과(.json) 또는 수동으로 붙여넣은 원문(.md/.txt)
//   --model claude-sonnet-5               모델 변경 (품질 우선이면 claude-opus-5)
//   --limit 20                            앞에서부터 N건만 변환
//
// 결과: threads/output/copies.json, threads/output/copies.md
// 변환 톤·규칙은 threads/convert-prompt.md 를 그대로 읽어 사용하므로, 톤을 바꾸려면 그 파일만 수정하세요.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const INPUT = getArg('input', 'threads/output/reposts.json');
const MODEL = getArg('model', 'claude-sonnet-5');
const PROXY = getArg('proxy', process.env.CLAUDE_PROXY_URL || '');
const LIMIT = Number(getArg('limit', '0'));
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CHUNK = 6; // 한 번의 요청에 넣을 글 수 (길이 초과 방지)

if (!PROXY && !API_KEY) {
  console.error('ANTHROPIC_API_KEY 환경변수를 설정하거나 --proxy <배포주소>/api/claude 를 지정하세요.');
  process.exit(1);
}
if (!existsSync(INPUT)) {
  console.error(`입력 파일이 없습니다: ${INPUT}`);
  console.error('먼저 threads/scrape-reposts.mjs 로 수집하거나, 원문을 .md 파일로 저장해 --input 으로 지정하세요.');
  process.exit(1);
}

// 입력 로드 — .json이면 수집 결과, 그 외에는 통째로 원문 목록 텍스트로 취급
let posts;
if (INPUT.endsWith('.json')) {
  const data = JSON.parse(readFileSync(INPUT, 'utf8'));
  posts = (data.posts ?? data).map((p) => ({
    author: p.author ?? '', text: p.text ?? '', likes: p.likes ?? null, url: p.url ?? '',
  }));
} else {
  posts = [{ author: '', text: readFileSync(INPUT, 'utf8'), likes: null, url: '' }];
}
if (LIMIT > 0) posts = posts.slice(0, LIMIT);
if (posts.length === 0) {
  console.error('변환할 글이 없습니다.');
  process.exit(1);
}

// 톤·작성 규칙은 convert-prompt.md 를 단일 출처로 사용
const promptPath = new URL('./convert-prompt.md', import.meta.url).pathname;
const basePrompt = readFileSync(promptPath, 'utf8');

const jsonInstruction = `
위 프롬프트의 분류·후킹 분석·카피 작성 규칙을 그대로 따르되, 결과는 표가 아니라
아래 스키마의 **JSON 배열만** 출력해. 설명 문장이나 코드펜스 없이 JSON만.

[
  {
    "index": 원문 번호(정수, 입력에 표기된 번호 그대로),
    "category": "🎯 마케팅·브랜딩 인사이트 | 💼 사업·자영업 현실 | 🔥 동기부여·마인드셋 | ⏰ 일·습관·자기관리 | 😂 공감·유머 | 🤖 트렌드·AI 활용 중 하나",
    "hook": "터진 이유 한 줄",
    "v1": "열정덕 카피 버전1 (500자 이내)",
    "v2": "열정덕 카피 버전2 (500자 이내)"
  }
]`;

async function callClaude(userText) {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: userText }],
  };
  const url = PROXY || 'https://api.anthropic.com/v1/messages';
  const headers = { 'Content-Type': 'application/json' };
  if (!PROXY) {
    headers['x-api-key'] = API_KEY;
    headers['anthropic-version'] = '2023-06-01';
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `API 오류 (HTTP ${res.status})`);
  return json.content.map((c) => c.text ?? '').join('');
}

function parseJson(text) {
  const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start < 0 || end < 0) throw new Error('응답에서 JSON 배열을 찾지 못했습니다');
  return JSON.parse(stripped.slice(start, end + 1));
}

const results = [];
for (let i = 0; i < posts.length; i += CHUNK) {
  const chunk = posts.slice(i, i + CHUNK);
  const listing = chunk
    .map((p, j) => {
      const n = i + j + 1;
      const meta = [p.author && `@${p.author}`, p.likes != null && `❤️ ${p.likes}`].filter(Boolean).join(' · ');
      return `### 원문 ${n}${meta ? ` (${meta})` : ''}\n${p.text}`;
    })
    .join('\n\n');
  const prompt = `${basePrompt}\n${jsonInstruction}\n\n[원문 목록]:\n\n${listing}`;

  process.stdout.write(`변환 중... ${Math.min(i + CHUNK, posts.length)}/${posts.length}\r`);
  const raw = await callClaude(prompt);
  for (const item of parseJson(raw)) {
    const src = posts[item.index - 1] ?? {};
    results.push({
      index: item.index,
      author: src.author ?? '',
      url: src.url ?? '',
      likes: src.likes ?? null,
      original: src.text ?? '',
      category: item.category ?? '',
      hook: item.hook ?? '',
      v1: item.v1 ?? '',
      v2: item.v2 ?? '',
    });
  }
}
console.log();

results.sort((a, b) => a.index - b.index);
mkdirSync('threads/output', { recursive: true });
writeFileSync(
  'threads/output/copies.json',
  JSON.stringify({ model: MODEL, generatedAt: new Date().toISOString(), items: results }, null, 2),
);

// 카테고리별로 묶은 마크다운 (노션에 그대로 붙여넣기 좋은 형태)
const byCategory = new Map();
for (const r of results) {
  if (!byCategory.has(r.category)) byCategory.set(r.category, []);
  byCategory.get(r.category).push(r);
}
const md = [`# 열정덕 카피 (${results.length}건 · ${MODEL})`, ''];
for (const [category, items] of byCategory) {
  md.push(`## ${category}`, '');
  for (const r of items) {
    md.push(`### #${r.index}${r.author ? ` · 원문 @${r.author}` : ''}${r.likes != null ? ` · ❤️ ${r.likes}` : ''}`);
    if (r.url) md.push(`원문: ${r.url}`);
    md.push('', `**터진 이유:** ${r.hook}`, '', '**v1**', '', r.v1, '', '**v2**', '', r.v2, '', '---', '');
  }
}
writeFileSync('threads/output/copies.md', md.join('\n'));

console.log(`${results.length}건 변환 완료:`);
console.log('  threads/output/copies.json');
console.log('  threads/output/copies.md');
console.log('게시하려면:  node threads/post-thread.mjs --list');
