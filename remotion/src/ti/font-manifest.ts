// 이 파일은 scripts/fetch-fonts.mjs 가 생성합니다. 직접 고치지 마세요.
export type FontFile = {
  family: string;
  weight: string;
  style: "normal" | "italic";
  file: string;
};

export const FONT_FILES: FontFile[] = [
  {
    family: "Nanum Myeongjo",
    weight: "400",
    style: "normal",
    file: "fonts/NanumMyeongjo-400.ttf"
  },
  {
    family: "Nanum Myeongjo",
    weight: "700",
    style: "normal",
    file: "fonts/NanumMyeongjo-700.ttf"
  },
  {
    family: "Nanum Myeongjo",
    weight: "800",
    style: "normal",
    file: "fonts/NanumMyeongjo-800.ttf"
  },
  {
    family: "Bodoni Moda",
    weight: "400",
    style: "italic",
    file: "fonts/BodoniModa-400-italic.ttf"
  },
  {
    family: "Bodoni Moda",
    weight: "400",
    style: "normal",
    file: "fonts/BodoniModa-400.ttf"
  },
  {
    family: "Bodoni Moda",
    weight: "600",
    style: "normal",
    file: "fonts/BodoniModa-600.ttf"
  }
];
