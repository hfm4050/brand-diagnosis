// 발행 대기열(threads/queue.json) 관리 도구
// 큐는 저장소에 커밋되어 Vercel 배포에 포함되고, 크론이 매일 위에서부터 순서대로 발행합니다.
//
// 사용법:
//   node threads/build-queue.mjs --list                  대기열 보기
//   node threads/build-queue.mjs --add 1:v1 --add 3:v2   copies.json 의 1번 v1, 3번 v2 를 큐에 추가
//   node threads/build-queue.mjs --all v1                copies.json 전체의 v1 을 큐에 추가
//   node threads/build-queue.mjs --text "직접 쓴 글"      임의 텍스트 추가
//   node threads/build-queue.mjs --remove 2              큐의 2번째 항목 삭제
//
// 추가한 뒤 git commit & push 해야 Vercel에 반영되어 자동 발행이 시작됩니다.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const QUEUE = 'threads/queue.json';
const COPIES = 'threads/output/copies.json';
const args = process.argv.slice(2);

const load = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const queue = load(QUEUE, { posts: [] });
const firstLine = (s) => (s ?? '').split('\n').find((l) => l.trim()) ?? '';

function addText(text, source) {
  text = (text ?? '').trim();
  if (!text) return console.error('빈 글은 추가할 수 없습니다.');
  if (text.length > 500) return console.error(`500자 초과라 추가하지 않았습니다 (${text.length}자): ${firstLine(text)}`);
  if (queue.posts.some((p) => (typeof p === 'string' ? p : p.text).trim() === text)) {
    return console.log(`이미 큐에 있어 건너뜀: ${firstLine(text)}`);
  }
  queue.posts.push({ text, source: source ?? '', addedAt: new Date().toISOString().slice(0, 10) });
  console.log(`추가됨 (#${queue.posts.length}): ${firstLine(text)}`);
}

let changed = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--list') {
    if (queue.posts.length === 0) console.log('대기열이 비어 있습니다.');
    queue.posts.forEach((p, n) => {
      const t = typeof p === 'string' ? p : p.text;
      console.log(`#${n + 1} (${t.length}자) ${firstLine(t)}`);
    });
  } else if (args[i] === '--text') {
    addText(args[++i], 'manual');
    changed = true;
  } else if (args[i] === '--remove') {
    const n = Number(args[++i]);
    const [removed] = queue.posts.splice(n - 1, 1);
    console.log(removed ? `삭제됨: ${firstLine(typeof removed === 'string' ? removed : removed.text)}` : `#${n} 항목이 없습니다.`);
    changed = !!removed;
  } else if (args[i] === '--add' || args[i] === '--all') {
    const copies = load(COPIES, null);
    if (!copies) {
      console.error(`${COPIES} 가 없습니다. 먼저 generate-copy.mjs 를 실행하세요.`);
      process.exit(1);
    }
    if (args[i] === '--all') {
      const version = args[++i] === 'v2' ? 'v2' : 'v1';
      for (const item of copies.items) addText(item[version], `#${item.index} ${version}`);
    } else {
      const [num, version = 'v1'] = args[++i].split(':');
      const item = copies.items.find((c) => c.index === Number(num));
      if (!item) console.error(`copies.json 에 #${num} 이 없습니다.`);
      else addText(item[version] ?? item.v1, `#${num} ${version}`);
    }
    changed = true;
  }
}

if (args.length === 0) {
  console.log('옵션: --list · --add <번호>:<v1|v2> · --all <v1|v2> · --text "..." · --remove <번호>');
}

if (changed) {
  writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n');
  console.log(`\n저장됨: ${QUEUE} (총 ${queue.posts.length}건)`);
  console.log('git add threads/queue.json && git commit -m "발행 큐 갱신" && git push 하면 자동 발행이 반영됩니다.');
}
