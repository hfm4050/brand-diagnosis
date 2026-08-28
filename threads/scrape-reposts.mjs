// 스레드 리포스트 수집 스크립트
// 사용법:  node threads/scrape-reposts.mjs --user duckpd7 --min-likes 100
//
// 브라우저 창이 열리고 프로필의 리포스트 탭을 스크롤하며,
// 스레드 웹이 내부적으로 호출하는 GraphQL 응답에서 글 데이터를 수집합니다.
// (화면 구조가 바뀌어도 동작하도록 DOM 대신 API 응답을 읽습니다)
//
// 로그인 벽이 뜨면 열린 창에서 직접 로그인한 뒤 터미널에서 Enter를 누르세요.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const USER = getArg('user', 'duckpd7');
const MIN_LIKES = Number(getArg('min-likes', '100'));
const SCROLLS = Number(getArg('scrolls', '30'));

const posts = new Map(); // code -> post

// GraphQL 응답 JSON을 깊이 탐색하며 게시글 모양의 객체를 수집
function collect(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(collect);
  const likes = node.like_count;
  const text = node?.caption?.text ?? node?.text_post_app_info?.text_fragments?.plaintext;
  if (typeof likes === 'number' && typeof text === 'string' && node.code) {
    const prev = posts.get(node.code);
    if (!prev || likes > prev.likes) {
      posts.set(node.code, {
        author: node?.user?.username ?? '',
        text,
        likes,
        reposts: node?.text_post_app_info?.repost_count ?? null,
        url: `https://www.threads.com/@${node?.user?.username ?? USER}/post/${node.code}`,
      });
    }
  }
  Object.values(node).forEach(collect);
}

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on('response', async (res) => {
  if (!res.url().includes('/graphql')) return;
  try { collect(await res.json()); } catch { /* JSON이 아닌 응답은 무시 */ }
});

console.log(`@${USER} 리포스트 탭을 엽니다...`);
await page.goto(`https://www.threads.com/@${USER}/reposts`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

// 로그인 벽 감지 시 대기
if ((await page.content()).includes('로그인') || page.url().includes('login')) {
  console.log('로그인이 필요해 보이면 브라우저 창에서 로그인한 뒤, 여기서 Enter를 누르세요.');
  await new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => { rl.close(); resolve(); });
  });
  await page.goto(`https://www.threads.com/@${USER}/reposts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
}

for (let i = 0; i < SCROLLS; i++) {
  await page.mouse.wheel(0, 2500);
  await page.waitForTimeout(1500);
  process.stdout.write(`\r스크롤 ${i + 1}/${SCROLLS} · 수집된 글 ${posts.size}개`);
}
console.log();
await browser.close();

const all = [...posts.values()].sort((a, b) => b.likes - a.likes);
const hits = all.filter((p) => p.likes >= MIN_LIKES && p.author !== USER);

mkdirSync('threads/output', { recursive: true });
writeFileSync('threads/output/reposts.json', JSON.stringify({ user: USER, minLikes: MIN_LIKES, collectedAt: new Date().toISOString(), posts: hits }, null, 2));

const md = [
  `# @${USER} 리포스트 (좋아요 ${MIN_LIKES}+ · ${hits.length}건)`,
  '',
  ...hits.map((p) => `## @${p.author} — ❤️ ${p.likes}${p.reposts ? ` · 🔁 ${p.reposts}` : ''}\n\n${p.text}\n\n${p.url}\n`),
].join('\n');
writeFileSync('threads/output/reposts.md', md);

console.log(`전체 ${all.length}건 중 좋아요 ${MIN_LIKES}+ 글 ${hits.length}건 저장:`);
console.log('  threads/output/reposts.json');
console.log('  threads/output/reposts.md');
console.log('이 파일을 Claude에게 주면서 "카테고리 분류하고 열정덕 카피로 변환해줘"라고 요청하세요.');
