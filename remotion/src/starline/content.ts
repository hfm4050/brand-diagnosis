/** 스타라인 4단계 시스템 — 문구는 여기만 고치면 된다. */

export type DayStep = {
  step: string;
  title: string;
  /** 순서가 있는 항목들 (STEP1처럼) */
  flow?: string[];
  /** 한 줄 설명 (STEP2, STEP3처럼). 줄바꿈은 배열로 직접 나눈다. */
  body?: string[];
};

export type CareItem = { t: string; sub?: string };
export type CarePhase = { when: string; items: CareItem[] };

export const TITLE = "스타라인 4단계 시스템";
export const SUBTITLE = "상담부터 6개월 사후 관리까지";

export const DAY_STEPS: DayStep[] = [
  {
    step: "STEP1",
    title: "듣고 보는 시간",
    flow: ["환자 환복", "세안", "사진 촬영", "상담 전 컨디션 체크"],
  },
  {
    step: "STEP2",
    title: "그리는 시간",
    body: ["원장과의 꼼꼼한 상담"],
  },
  {
    step: "STEP3",
    title: "수술 진행",
    body: ["거상 수술은 환자에게 집중하기 위해", "1일 1건만 진행합니다"],
  },
];

export const CARE_TITLE = { step: "STEP4", title: "별빛 케어 프로그램" };

export const CARE: CarePhase[] = [
  {
    when: "1~2일차",
    items: [
      { t: "붕대, 해모박 제거" },
      { t: "상처 재생 드레싱" },
      { t: "항생주사" },
      { t: "치유 촉진 레이저" },
      { t: "고압산소 치료" },
    ],
  },
  {
    when: "7~14일차",
    items: [
      { t: "실밥 제거" },
      { t: "상처 재생 드레싱" },
      { t: "치유 촉진 레이저", sub: "힐라이트 or 스마트룩스" },
    ],
  },
  {
    when: "1개월차",
    items: [
      { t: "치유 촉진 레이저", sub: "힐라이트 or 스마트룩스" },
      { t: "중력 저하 주사" },
    ],
  },
  {
    when: "3~6개월차",
    items: [
      { t: "퍼스널 레이저", sub: "피부 탄력 or 근막 볼륨" },
      { t: "중력 저하 주사" },
      { t: "줄기세포 스킨팩" },
    ],
  },
];
