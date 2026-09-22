import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const photoShotSchema = z.object({
  /** public/ 아래 사진 경로. 비우면 자리표시자가 나온다. 예: "shot/photo.jpg" */
  src: z.string(),
  /** 8초 동안의 총 확대량. 1.06 = 6%, "almost imperceptible" */
  pushIn: z.number().min(1).max(1.4),
  /** 창광선이 들어오는 쪽 */
  beamFrom: z.enum(["left", "right"]),
  /** 웜 빈티지 그레이딩 강도 */
  warmth: z.number().min(0).max(1),
  /** 35mm 그레인 강도 */
  grain: z.number().min(0).max(1),
  /** 빛줄기 속 먼지 개수 */
  motes: z.number().min(0).max(120),
});

export type PhotoShotProps = z.infer<typeof photoShotSchema>;

/**
 * 사진 한 장에 카메라와 필름을 입힌다.
 *
 * Remotion은 생성 모델이 아니라 렌더러다. 인물의 연기는 만들 수 없고,
 * 프롬프트에서 "카메라 / 그레이드 / 페이스"에 해당하는 부분만 담당한다.
 * 즉 결과물은 연기하는 사람이 아니라 '움직이는 사진'이다.
 */
export const PhotoShot: React.FC<PhotoShotProps> = ({
  src,
  pushIn,
  beamFrom,
  warmth,
  grain,
  motes,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // 푸시인은 선형이 맞다. 이징을 걸면 8초 안에서 멈칫하는 게 보인다.
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], clamp);
  const scale = 1 + (pushIn - 1) * t;

  // 게이트 위브 — 필름 카메라가 프레임마다 0.1px씩 흔들리는 그것.
  const weaveX = (random(`wx${frame}`) - 0.5) * 0.9;
  const weaveY = (random(`wy${frame}`) - 0.5) * 0.9;

  // 머리와 꼬리에서 검게 물린다.
  const fade =
    interpolate(frame, [0, 14], [0, 1], clamp) *
    interpolate(frame, [durationInFrames - 20, durationInFrames - 1], [1, 0], clamp);

  const beamAngle = beamFrom === "left" ? "100deg" : "260deg";

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fade }}>
        {/* ── 사진 ─────────────────────────────────────────── */}
        <AbsoluteFill
          style={{
            transform: `scale(${scale.toFixed(4)}) translate(${weaveX.toFixed(2)}px, ${weaveY.toFixed(2)}px)`,
            transformOrigin: "52% 46%",
          }}
        >
          {src ? (
            <Img
              src={staticFile(src)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Placeholder beamFrom={beamFrom} />
          )}
        </AbsoluteFill>

        {/* ── 창측 광선 ────────────────────────────────────── */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(${beamAngle}, rgba(255,214,150,0.30) 0%, rgba(255,198,126,0.10) 26%, rgba(0,0,0,0) 58%)`,
            mixBlendMode: "screen",
            opacity: 0.85,
          }}
        />

        {/* ── 빛줄기 속 먼지 ───────────────────────────────── */}
        <Motes count={Math.round(motes)} beamFrom={beamFrom} />

        {/* ── 웜 빈티지 그레이딩 ───────────────────────────── */}
        {/* 앰버 하이라이트 */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(0deg, #2a1608 0%, #b2712c 100%)",
            mixBlendMode: "soft-light",
            opacity: 0.5 * warmth,
          }}
        />
        {/* 들린 먹색 — 블랙이 완전히 안 떨어지는 그 느낌 */}
        <AbsoluteFill
          style={{
            background: "#6b5a49",
            mixBlendMode: "lighten",
            opacity: 0.09 * warmth,
          }}
        />

        {/* ── 비네팅 ───────────────────────────────────────── */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 74% 68% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.30) 78%, rgba(0,0,0,0.62) 100%)",
          }}
        />

        {/* ── 35mm 그레인 ──────────────────────────────────── */}
        <Grain frame={frame} amount={grain} width={width} height={height} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** feTurbulence로 만든 필름 그레인. 프레임마다 시드를 바꿔 실제로 끓게 한다. */
const Grain: React.FC<{
  frame: number;
  amount: number;
  width: number;
  height: number;
}> = ({ frame, amount, width, height }) => {
  if (amount <= 0) return null;
  // 필터 id를 프레임마다 바꿔야 브라우저가 노이즈를 다시 계산한다.
  const id = `grain-${frame}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        mixBlendMode: "overlay",
        opacity: 0.4 * amount,
        pointerEvents: "none",
      }}
    >
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={frame % 211}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={width} height={height} filter={`url(#${id})`} />
    </svg>
  );
};

/** 광선 안에서 아주 느리게 떠다니는 먼지. 시드 고정이라 렌더마다 같다. */
const Motes: React.FC<{ count: number; beamFrom: "left" | "right" }> = ({
  count,
  beamFrom,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (count <= 0) return null;

  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const bx = random(`mx${i}`);
        const by = random(`my${i}`);
        const speed = 0.06 + random(`ms${i}`) * 0.14;
        const size = 1.4 + random(`mz${i}`) * 3.2;
        const alpha = 0.08 + random(`ma${i}`) * 0.34;

        // 광선이 닿는 쪽 60% 안에만 둔다.
        const xPct = beamFrom === "left" ? bx * 58 + 3 : 97 - (bx * 58 + 3);
        // 느리게 아래로 흐르며, 가로로도 살짝 밀린다.
        const yPct = ((by + progress * speed) % 1) * 104 - 2;
        const sway = Math.sin((by + progress) * Math.PI * 2) * 0.7;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${xPct + sway}%`,
              top: `${yPct}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "rgba(255,236,204,1)",
              opacity: alpha,
              filter: `blur(${(size * 0.28).toFixed(2)}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 사진이 아직 없을 때. 어두운 실내에 창광이 들어오는 톤만 잡아두어
 * 카메라 무빙·그레이딩·그레인이 제대로 도는지 이 상태로도 확인할 수 있다.
 */
const Placeholder: React.FC<{ beamFrom: "left" | "right" }> = ({ beamFrom }) => (
  <AbsoluteFill
    style={{
      background:
        beamFrom === "left"
          ? "radial-gradient(ellipse 70% 90% at 16% 30%, #6a5237 0%, #3a2c1f 38%, #1c1512 72%, #100c0a 100%)"
          : "radial-gradient(ellipse 70% 90% at 84% 30%, #6a5237 0%, #3a2c1f 38%, #1c1512 72%, #100c0a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 520,
        height: 300,
        border: "1px dashed rgba(255,225,190,0.34)",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,232,203,0.6)",
        fontFamily: "'Nanum Myeongjo', serif",
        fontSize: 27,
        letterSpacing: "0.06em",
        textAlign: "center",
        lineHeight: 1.7,
      }}
    >
      사진을 remotion/public/shot/ 에 넣고
      <br />
      src 를 지정하세요
    </div>
  </AbsoluteFill>
);
