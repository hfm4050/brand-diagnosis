import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { INK_FAINT, LOUD, PAPER, RULE } from "./theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * 한 글자씩 등장. 블러가 걷히면서 아래에서 올라오고, 자간이 조여든다.
 * 글자 단위로 스프링을 어긋나게 걸어 손으로 쓴 것 같은 리듬을 만든다.
 */
export const Chars: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  rise?: number;
  blur?: number;
  /** 등장 시 벌어져 있다가 제자리로 조여드는 자간(px) */
  spread?: number;
  damping?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  stagger = 3,
  rise = 26,
  blur = 13,
  spread = 6,
  damping = 200,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {Array.from(text).map((ch, i) => {
        const local = frame - delay - i * stagger;
        const p = spring({
          frame: Math.max(0, local),
          fps,
          config: { damping, mass: 0.7, stiffness: 110 },
        });
        const opacity = interpolate(local, [0, 9], [0, 1], clamp);
        const b = interpolate(local, [0, 15], [blur, 0], clamp);
        const rest = 1 - p;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity,
              filter: b > 0.06 ? `blur(${b.toFixed(2)}px)` : undefined,
              transform: `translateY(${(rest * rise).toFixed(2)}px)`,
              letterSpacing: `${(rest * spread).toFixed(2)}px`,
              willChange: "transform, opacity, filter",
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </span>
  );
};

/** 가로 괘선이 그어진다. */
export const Rule: React.FC<{
  delay?: number;
  duration?: number;
  color?: string;
  origin?: string;
  style?: React.CSSProperties;
}> = ({
  delay = 0,
  duration = 24,
  color = RULE,
  origin = "center",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        height: 1,
        background: color,
        transform: `scaleX(${p})`,
        transformOrigin: origin,
        ...style,
      }}
    />
  );
};

/** 세로 거터 괘선이 가운데에서 위아래로 뻗는다. */
export const VRule: React.FC<{ delay?: number; color?: string }> = ({
  delay = 0,
  color = RULE,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 28], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width: 1,
        height: "100%",
        background: color,
        transform: `scaleY(${p})`,
        transformOrigin: "center",
      }}
    />
  );
};

/** 캘리퍼 눈금 — 성형은 1~2mm 단위의 계측이라는 이 영상의 전제. */
export const Caliper: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 1180,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 34], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width,
        height: 17,
        transform: `scaleX(${p})`,
        transformOrigin: "center",
        borderBottom: `1px solid ${INK_FAINT}`,
        backgroundImage: [
          `repeating-linear-gradient(to right, ${INK_FAINT} 0 1px, transparent 1px 56px)`,
          `repeating-linear-gradient(to right, ${RULE} 0 1px, transparent 1px 9px)`,
        ].join(","),
        backgroundSize: "100% 16px, 100% 7px",
        backgroundPosition: "bottom left, bottom left",
        backgroundRepeat: "repeat-x, repeat-x",
      }}
    />
  );
};

/**
 * 씬 래퍼. 아주 느린 푸시인으로 화면에 생기를 주고,
 * 끝에서는 블러와 함께 위로 빠지며 다음 씬에 자리를 넘긴다.
 */
export const Scene: React.FC<{
  duration: number;
  children: React.ReactNode;
  fadeOut?: number;
}> = ({ duration, children, fadeOut = 18 }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [duration - fadeOut, duration], [0, 1], clamp);
  const push = interpolate(frame, [0, duration], [1, 1.014], clamp);

  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        opacity: 1 - out,
        transform: `scale(${push}) translateY(${(-out * 26).toFixed(2)}px)`,
        filter: out > 0.01 ? `blur(${(out * 9).toFixed(2)}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** 여섯 축 중 어디쯤인지 — 눈금 하나가 붉게 길어진다. */
export const Progress: React.FC<{ index: number; delay?: number }> = ({
  index,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 16], [0, 1], clamp);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 13,
        height: 22,
        opacity,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: i === index ? 22 : 9,
            background: i === index ? LOUD : RULE,
          }}
        />
      ))}
    </div>
  );
};
