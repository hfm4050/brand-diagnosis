import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Chars } from "../ti/kinetic";
import { KR } from "../ti/fonts";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const storyCardSchema = z.object({
  /** 좌상단 뱃지 문구. 비우면 안 그린다. */
  badge: z.string(),
  /** 뱃지 색 */
  accent: z.string(),
  /** 메모지에 적히는 사연. 줄바꿈은 배열로 직접 나눈다. */
  lines: z.array(z.string()),
  /** 좌측 인서트에 넣을 이미지. public/ 기준 경로. 비우면 자리표시자. */
  insertSrc: z.string(),
});

export type StoryCardProps = z.infer<typeof storyCardSchema>;

/**
 * 사진이 아니라 도형으로 그린 상담소 카드.
 *
 * 프레임, 크라프트 보드, 메모지, 집게, 인서트까지 전부 SVG와 CSS로 그린다.
 * 남의 방송 화면을 가져다 쓸 일이 없고, lines 만 갈아끼우면 같은 포맷으로
 * 사연을 계속 찍어낼 수 있다.
 */
export const StoryCard: React.FC<StoryCardProps> = ({
  badge,
  accent,
  lines,
  insertSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = (delay: number, damping = 200) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping, mass: 0.8, stiffness: 95 },
    });

  const frameIn = interpolate(frame, [0, 22], [0, 1], clamp);
  const boardIn = enter(10);
  const sheetIn = enter(20);
  const insertIn = enter(26);
  const clipIn = enter(34, 13); // 집게는 튕기게 — 감쇠를 낮춘다
  const badgeIn = enter(44);

  return (
    <AbsoluteFill style={{ background: "#241B12" }}>
      {/* ── 책상 ─────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 82% 70% at 50% 42%, #7A5F42 0%, #53402C 42%, #31261A 74%, #1E170F 100%)",
        }}
      />
      {/* 아래로 깔리는 어둠 — 배경이 아웃포커스로 떨어지는 느낌 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 54%, rgba(20,14,9,0.55) 74%, rgba(12,8,5,0.9) 100%)",
        }}
      />

      {/* ── 크라프트 보드 ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 742,
          top: 150,
          width: 906,
          height: 812,
          background:
            "linear-gradient(168deg, #D2A273 0%, #C08E5C 46%, #A87343 100%)",
          transform: `rotate(-0.7deg) scale(${(0.965 + boardIn * 0.035).toFixed(4)})`,
          transformOrigin: "50% 40%",
          opacity: boardIn,
          boxShadow: "0 38px 70px rgba(0,0,0,0.5)",
        }}
      />

      {/* ── 뒤에 겹친 메모지 두 장 ───────────────────────── */}
      {[
        { dx: 24, dy: 18, rot: 1.9, tone: "#EFE9DE" },
        { dx: -16, dy: 9, rot: -1.5, tone: "#F5F1E9" },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 812 + s.dx,
            top: 196 + s.dy,
            width: 766,
            height: 726,
            background: s.tone,
            transform: `rotate(${s.rot}deg) scale(${(0.97 + sheetIn * 0.03).toFixed(4)})`,
            transformOrigin: "50% 12%",
            opacity: sheetIn,
            boxShadow: "0 10px 26px rgba(0,0,0,0.3)",
          }}
        />
      ))}

      {/* ── 사연이 적히는 앞장 ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 812,
          top: 196,
          width: 766,
          height: 726,
          background: "linear-gradient(176deg, #FDFCF8 0%, #F6F3EB 100%)",
          transform: `rotate(-0.35deg) scale(${(0.97 + sheetIn * 0.03).toFixed(4)})`,
          transformOrigin: "50% 12%",
          opacity: sheetIn,
          boxShadow: "0 16px 34px rgba(0,0,0,0.32)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "128px 58px 84px",
        }}
      >
        {lines.map((line, i) => (
          <Chars
            key={i}
            text={line}
            delay={64 + i * 13}
            stagger={1.7}
            rise={16}
            blur={8}
            spread={3}
            style={{
              fontFamily: KR,
              fontWeight: 700,
              fontSize: 54,
              lineHeight: 1.62,
              color: "#171512",
            }}
          />
        ))}
      </div>

      {/* ── 집게 ─────────────────────────────────────────── */}
      <Clip x={1100} y={120} progress={clipIn} />

      {/* ── 좌측 인서트 ──────────────────────────────────── */}
      <Insert x={186} y={352} size={344} progress={insertIn} src={insertSrc} />

      {/* ── 손그림 프레임 ────────────────────────────────── */}
      <RoughFrame width={width} height={height} progress={frameIn} />

      {/* ── 뱃지 ─────────────────────────────────────────── */}
      {badge ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 78,
            background: accent,
            padding: "14px 30px 18px",
            transform: `rotate(-0.6deg) scale(${(0.9 + badgeIn * 0.1).toFixed(3)})`,
            transformOrigin: "0% 50%",
            opacity: badgeIn,
          }}
        >
          <span
            style={{
              fontFamily: KR,
              fontWeight: 800,
              fontSize: 46,
              letterSpacing: "0.02em",
              color: "#fff",
            }}
          >
            {badge}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 손으로 그린 듯 흔들리는 사각 테두리. 시드 고정이라 프레임마다 떨지 않는다. */
const RoughFrame: React.FC<{
  width: number;
  height: number;
  progress: number;
}> = ({ width, height, progress }) => {
  const inset = 52;
  const step = 46;
  const amp = 9;

  const pts: string[] = [];
  let i = 0;
  const push = (x: number, y: number) => {
    const jx = (random(`fx${i}`) - 0.5) * amp;
    const jy = (random(`fy${i}`) - 0.5) * amp;
    i += 1;
    pts.push(`${(x + jx).toFixed(1)} ${(y + jy).toFixed(1)}`);
  };
  for (let x = inset; x < width - inset; x += step) push(x, inset);
  for (let y = inset; y < height - inset; y += step) push(width - inset, y);
  for (let x = width - inset; x > inset; x -= step) push(x, height - inset);
  for (let y = height - inset; y > inset; y -= step) push(inset, y);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0, opacity: progress }}
    >
      <path
        d={`M ${pts.join(" L ")} Z`}
        fill="none"
        stroke="#FBF8F2"
        strokeWidth={15}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** 서류 집게. 위에서 떨어져 내려와 종이를 문다. */
const Clip: React.FC<{ x: number; y: number; progress: number }> = ({
  x,
  y,
  progress,
}) => {
  const drop = interpolate(progress, [0, 1], [-80, 0]);
  return (
    <svg
      width={190}
      height={150}
      viewBox="0 0 190 150"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: progress,
        transform: `translateY(${drop.toFixed(1)}px)`,
      }}
    >
      <path
        d="M62 60 L38 16 A9 9 0 0 1 52 8 L82 54"
        fill="none"
        stroke="#A0A4AA"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M128 60 L152 16 A9 9 0 0 0 138 8 L108 54"
        fill="none"
        stroke="#A0A4AA"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path d="M26 56 L164 56 L150 138 L40 138 Z" fill="#171717" />
      <path d="M26 56 L164 56 L159 74 L31 74 Z" fill="#2E2E2E" />
    </svg>
  );
};

/** 좌측 둥근 인서트. 이미지가 없으면 자리표시자를 그린다. */
const Insert: React.FC<{
  x: number;
  y: number;
  size: number;
  progress: number;
  src: string;
}> = ({ x, y, size, progress, src }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size * 0.27,
      overflow: "hidden",
      background: "linear-gradient(160deg, #7A6148 0%, #3A2B1C 100%)",
      border: "2px dashed rgba(255,232,200,0.28)",
      opacity: progress,
      transform: `scale(${(0.9 + progress * 0.1).toFixed(3)})`,
      boxShadow: "0 22px 44px rgba(0,0,0,0.46)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {src ? (
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <span
        style={{
          fontFamily: KR,
          fontWeight: 400,
          fontSize: 26,
          lineHeight: 1.7,
          color: "rgba(255,238,214,0.72)",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}
      >
        인서트
        <br />
        insertSrc
      </span>
    )}
  </div>
);
