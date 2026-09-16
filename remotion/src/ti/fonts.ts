import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { FONT_FILES } from "./font-manifest";

/** 국문 표제 — 나눔명조. 하이컨트라스트 세리프. */
export const KR = "'Nanum Myeongjo', 'Apple SD Gothic Neo', serif";
/** 라틴 — Bodoni Moda. 디돈. 키커와 versus에만 쓴다. */
export const LATIN = "'Bodoni Moda', Georgia, serif";

// public/fonts/ 의 파일만 쓴다. 렌더 중 네트워크를 타지 않으므로 어느 환경에서
// 돌려도 같은 서체가 나온다. 파일은 `npm run fonts` 가 채운다.
const handle = delayRender("폰트 로딩");

Promise.all(
  FONT_FILES.map(async (f) => {
    const face = new FontFace(
      f.family,
      `url(${staticFile(f.file)}) format("truetype")`,
      { weight: f.weight, style: f.style }
    );
    await face.load();
    document.fonts.add(face);
  })
)
  .then(() => continueRender(handle))
  .catch((err: Error) =>
    // 조용히 고딕으로 폴백하느니 실패시키는 편이 낫다.
    cancelRender(
      new Error(
        `폰트를 불러오지 못했습니다. \`npm run fonts\` 로 public/fonts/ 를 채우세요. (${err.message})`
      )
    )
  );
