/** 인포그래픽과 동일한 보그 팔레트 — 종이 흰색 / 먹색 / 시그니처 레드 하나. */
export const PAPER = "#FCFBF9";
export const INK = "#121110";
export const INK_SOFT = "#6B6660";
export const INK_FAINT = "#9C968E";
export const RULE = "#DCD7CF";
export const RULE_HAIR = "#E8E4DD";
export const LOUD = "#B01F2E";

/** 씬 길이(프레임 @30fps) */
export const D = {
  title: 200,
  thesis: 200,
  axis: 175,
  tell: 185,
  end: 130,
} as const;

export const FPS = 30;
export const AXIS_COUNT = 6;
export const TOTAL =
  D.title + D.thesis + D.axis * AXIS_COUNT + D.tell + D.end;
