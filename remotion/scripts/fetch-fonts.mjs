#!/usr/bin/env node
/**
 * 폰트를 public/fonts/ 로 내려받고 src/ti/font-manifest.ts 를 갱신한다.
 *
 * 렌더 중에 웹폰트를 불러오면 네트워크가 막히거나 프록시가 CORS·인증서를 건드릴 때
 * 일부 글자만 시스템 고딕으로 폴백돼 씬마다 서체가 달라진다. 파일을 먼저 받아두고
 * staticFile()로 붙이면 렌더가 네트워크와 무관해진다.
 *
 * 한글은 google/fonts 저장소의 원본 TTF를 쓴다. fonts.googleapis.com 의 구형
 * 엔드포인트는 한글 폰트도 라틴 154자짜리로만 내려주기 때문에 쓸 수 없다.
 *
 *   node scripts/fetch-fonts.mjs          # 없는 것만 받음
 *   node scripts/fetch-fonts.mjs --force  # 전부 다시 받음
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = join(ROOT, "public", "fonts");
const MANIFEST = join(ROOT, "src", "ti", "font-manifest.ts");
const FORCE = process.argv.includes("--force");

const GH = "https://raw.githubusercontent.com/google/fonts/main";
/** 구형 CSS 엔드포인트는 유니코드 레인지로 쪼개지 않은 라틴 TTF 한 벌을 준다. */
const LEGACY_UA = "Mozilla/5.0 (Windows NT 6.1)";

/** 한글 — 저장소 원본 TTF (음절 11,172자 전부 포함) */
const HANGUL = {
  family: "Nanum Myeongjo",
  dir: "ofl/nanummyeongjo",
  faces: [
    { weight: "400", style: "normal", src: "NanumMyeongjo-Regular.ttf" },
    { weight: "700", style: "normal", src: "NanumMyeongjo-Bold.ttf" },
    { weight: "800", style: "normal", src: "NanumMyeongjo-ExtraBold.ttf" },
  ],
};

/** 라틴 — 키커와 versus에만 쓰므로 구형 엔드포인트로 충분하다. */
const LATIN = { family: "Bodoni Moda", variants: ["400", "600", "400italic"] };

/** 한글 폰트가 라틴만 담긴 파일로 바뀌는 사고를 막는 최소 검사. */
const MIN_HANGUL_GLYPHS = 10000;

const slug = (s) => s.replace(/[^A-Za-z0-9]+/g, "");

const numGlyphs = (buf) => {
  const d = Buffer.from(buf);
  const n = d.readUInt16BE(4);
  for (let i = 0; i < n; i += 1) {
    const o = 12 + i * 16;
    if (d.toString("latin1", o, o + 4) === "maxp") {
      return d.readUInt16BE(d.readUInt32BE(o + 8) + 4);
    }
  }
  throw new Error("maxp 테이블 없음 — TTF가 아닙니다.");
};

const get = async (url, what) => {
  const r = await fetch(url, { headers: { "User-Agent": LEGACY_UA } });
  if (!r.ok) throw new Error(`${what}: HTTP ${r.status}`);
  return r;
};

const exists = async (p) => {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
};

let downloaded = 0;

const save = async (name, url, minGlyphs) => {
  const dest = join(FONT_DIR, name);
  if (!FORCE && (await exists(dest))) return;

  const buf = await (await get(url, name)).arrayBuffer();
  const glyphs = numGlyphs(buf);
  if (minGlyphs && glyphs < minGlyphs) {
    throw new Error(
      `${name}: 글리프가 ${glyphs}개뿐입니다 (${minGlyphs}개 이상 필요). ` +
        `한글이 빠진 라틴 서브셋을 받은 것 같습니다.`
    );
  }
  await writeFile(dest, Buffer.from(buf));
  downloaded += 1;
  console.log(
    `  ↓ ${name} (${(buf.byteLength / 1024 / 1024).toFixed(1)} MB, 글리프 ${glyphs})`
  );
};

const main = async () => {
  await mkdir(FONT_DIR, { recursive: true });
  const entries = [];

  for (const face of HANGUL.faces) {
    const name = `${slug(HANGUL.family)}-${face.weight}.ttf`;
    await save(name, `${GH}/${HANGUL.dir}/${face.src}`, MIN_HANGUL_GLYPHS);
    entries.push({
      family: HANGUL.family,
      weight: face.weight,
      style: face.style,
      file: `fonts/${name}`,
    });
  }

  const url =
    `https://fonts.googleapis.com/css?family=` +
    `${encodeURIComponent(LATIN.family).replace(/%20/g, "+")}:${LATIN.variants.join(",")}`;
  const css = await (await get(url, LATIN.family)).text();

  const re =
    /@font-face\s*\{[^}]*?font-style:\s*(\w+);[^}]*?font-weight:\s*(\d+);[^}]*?src:\s*url\((https:[^)]+\.ttf)\)/g;
  const faces = [...css.matchAll(re)];
  if (faces.length !== LATIN.variants.length) {
    throw new Error(
      `${LATIN.family}: ${LATIN.variants.length}개를 기대했는데 ${faces.length}개를 찾았습니다.`
    );
  }

  for (const [, style, weight, src] of faces) {
    const name = `${slug(LATIN.family)}-${weight}${
      style === "italic" ? "-italic" : ""
    }.ttf`;
    await save(name, src, 0);
    entries.push({ family: LATIN.family, weight, style, file: `fonts/${name}` });
  }

  await writeFile(
    MANIFEST,
    `// 이 파일은 scripts/fetch-fonts.mjs 가 생성합니다. 직접 고치지 마세요.
export type FontFile = {
  family: string;
  weight: string;
  style: "normal" | "italic";
  file: string;
};

export const FONT_FILES: FontFile[] = ${JSON.stringify(entries, null, 2).replace(
      /"(family|weight|style|file)":/g,
      "$1:"
    )};
`
  );

  console.log(
    downloaded === 0
      ? `폰트 ${entries.length}개 준비됨 (이미 받아둔 것 사용).`
      : `폰트 ${downloaded}개 새로 받음 / 총 ${entries.length}개.`
  );
};

main().catch((err) => {
  console.error("폰트 내려받기 실패:", err.message);
  process.exit(1);
});
