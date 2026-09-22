import React from "react";

/**
 * feTurbulence로 만든 필름 그레인.
 * 프레임마다 시드를 바꿔야 실제로 끓는다 — 고정하면 정지한 얼룩으로 보인다.
 */
export const Grain: React.FC<{
  frame: number;
  amount: number;
  width: number;
  height: number;
  /** 어두운 화면에서는 'soft-light'가 덜 튄다. */
  blend?: "overlay" | "soft-light";
}> = ({ frame, amount, width, height, blend = "overlay" }) => {
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
        mixBlendMode: blend,
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
