import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GOTHIC } from "../ti/fonts";
import {
  CARE,
  CARE_TITLE,
  DAY_STEPS,
  SUBTITLE,
  TITLE,
  type CarePhase,
  type DayStep,
} from "./content";

/* 스타라인 아이덴티티 — 다크 그라운드, 오렌지 하나, 흰 볼드 고딕, 4각 스파클 */
const BG = "#121214";
const ORANGE = "#F0682C";
const WHITE = "#FFFFFF";
const MUTED = "#A3A3AB";
const LINE = "rgba(255,255,255,0.14)";
const CARD = "rgba(255,255,255,0.045)";
const CARD_EDGE = "rgba(255,255,255,0.09)";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 등장 진행도 0→1. 프레임 단위 지연. */
const useEnter = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (delay: number) =>
    spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 200, mass: 0.7, stiffness: 120 },
    });
};

/** 위로 살짝 올라오며 나타나는 스타일 */
const rise = (p: number, dist = 22): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${((1 - p) * dist).toFixed(2)}px)`,
});

/**
 * 스타라인 4단계를 한 장에.
 *
 * 위 줄은 수술까지의 흐름(STEP1→2→3), 아래는 그 뒤 6개월(STEP4).
 * 실제 정보량이 STEP4에 몰려 있어서 4칸을 균등 분할하지 않고
 * 두 줄로 나눴다.
 */
export const StarlineSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter();

  const headIn = enter(0);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 70% at 18% 0%, #241A16 0%, ${BG} 46%, #0B0B0D 100%)`,
        fontFamily: GOTHIC,
        color: WHITE,
      }}
    >
      <StarField frame={frame} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "58px 80px 60px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            ...rise(headIn, 14),
          }}
        >
          <Starburst size={78} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <span
              style={{
                fontWeight: 900,
                fontSize: 56,
                letterSpacing: "-0.02em",
              }}
            >
              {TITLE}
            </span>
            <span style={{ fontWeight: 700, fontSize: 26, color: MUTED }}>
              {SUBTITLE}
            </span>
          </div>
        </div>

        {/* ── STEP 1 → 2 → 3 ───────────────────────────────── */}
        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "1fr 64px 1fr 64px 1fr",
            alignItems: "stretch",
          }}
        >
          {DAY_STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <DayCard step={s} p={enter(10 + i * 8)} />
              {i < DAY_STEPS.length - 1 ? (
                <Connector p={enter(22 + i * 8)} />
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 4 ───────────────────────────────────────── */}
        <div style={{ marginTop: 40, ...rise(enter(40), 16) }}>
          <StepBadge step={CARE_TITLE.step} title={CARE_TITLE.title} />
        </div>

        <div
          style={{
            marginTop: 22,
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 22,
          }}
        >
          {CARE.map((phase, i) => (
            <PhaseCard
              key={phase.when}
              phase={phase}
              delay={50 + i * 8}
              enter={enter}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ────────────────────────────────────────────────────────── */

/** 오렌지 뱃지 "STEP1 | 듣고 보는 시간" — 원본 화면과 같은 형식 */
const StepBadge: React.FC<{ step: string; title: string; size?: number }> = ({
  step,
  title,
  size = 31,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.45,
      background: ORANGE,
      padding: `${size * 0.32}px ${size * 0.7}px ${size * 0.36}px`,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      color: WHITE,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ fontWeight: 800 }}>{step}</span>
    <span
      style={{
        width: 2,
        height: size * 0.82,
        background: "rgba(255,255,255,0.85)",
      }}
    />
    <span>{title}</span>
  </div>
);

const DayCard: React.FC<{ step: DayStep; p: number }> = ({ step, p }) => (
  <div
    style={{
      background: CARD,
      border: `1px solid ${CARD_EDGE}`,
      padding: "28px 30px 30px",
      display: "flex",
      flexDirection: "column",
      gap: 22,
      ...rise(p),
    }}
  >
    <div>
      <StepBadge step={step.step} title={step.title} size={29} />
    </div>

    {step.flow ? (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          rowGap: 12,
          columnGap: 12,
          fontWeight: 700,
          fontSize: 27,
          lineHeight: 1.35,
        }}
      >
        {step.flow.map((f, i) => (
          <span
            key={f}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              whiteSpace: "nowrap",
            }}
          >
            {i > 0 ? (
              <span
                style={{
                  width: 26,
                  height: 2,
                  background: "rgba(255,255,255,0.55)",
                }}
              />
            ) : null}
            {f}
          </span>
        ))}
      </div>
    ) : null}

    {step.body ? (
      <div style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.45 }}>
        {step.body.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    ) : null}
  </div>
);

/** STEP 사이의 흐름 표시 — 선 위에 작은 스파클 */
const Connector: React.FC<{ p: number }> = ({ p }) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 6,
        right: 6,
        top: "50%",
        height: 2,
        background: ORANGE,
        transform: `scaleX(${p.toFixed(3)})`,
        transformOrigin: "left center",
      }}
    />
    <div style={{ position: "relative", opacity: p }}>
      <Sparkle size={30} color={WHITE} />
    </div>
  </div>
);

/** 붓으로 칠한 듯한 오렌지 기간 표시 */
const PhasePill: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      display: "inline-block",
      background: ORANGE,
      padding: "10px 24px 12px",
      fontWeight: 900,
      fontSize: 39,
      lineHeight: 1,
      color: WHITE,
      letterSpacing: "-0.01em",
      clipPath:
        "polygon(1% 10%, 7% 0%, 31% 5%, 57% 0%, 84% 4%, 99% 0%, 100% 42%, 98% 93%, 79% 100%, 52% 95%, 24% 100%, 3% 94%, 0% 56%)",
    }}
  >
    {text}
  </div>
);

const PhaseCard: React.FC<{
  phase: CarePhase;
  delay: number;
  enter: (d: number) => number;
}> = ({ phase, delay, enter }) => (
  <div
    style={{
      background: CARD,
      border: `1px solid ${CARD_EDGE}`,
      padding: "30px 30px 26px",
      display: "flex",
      flexDirection: "column",
      gap: 26,
      ...rise(enter(delay)),
    }}
  >
    <div>
      <PhasePill text={phase.when} />
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 21 }}>
      {phase.items.map((item, i) => (
        <div
          key={item.t + i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            ...rise(enter(delay + 8 + i * 3), 10),
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 5 }}>
            <Sparkle size={27} color={WHITE} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.25 }}>
              {item.t}
            </div>
            {item.sub ? (
              <div
                style={{
                  marginTop: 6,
                  fontWeight: 500,
                  fontSize: 23,
                  lineHeight: 1.3,
                  color: MUTED,
                }}
              >
                ({item.sub})
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── 별 ──────────────────────────────────────────────────── */

/** 4각 스파클 — 원본 화면의 불릿과 같은 모양 */
const Sparkle: React.FC<{ size: number; color: string; opacity?: number }> = ({
  size,
  color,
  opacity = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", opacity }}>
    <path
      d="M50 0 C53 32 68 47 100 50 C68 53 53 68 50 100 C47 68 32 53 0 50 C32 47 47 32 50 0 Z"
      fill={color}
    />
  </svg>
);

/** 좌상단 스타버스트 마크 — 큰 스파클 + 45° 작은 스파클 + 주변 잔별 */
const Starburst: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <g transform="rotate(45 50 50)">
      <path
        d="M50 18 C51.6 40 58 48.4 82 50 C58 51.6 51.6 60 50 82 C48.4 60 42 51.6 18 50 C42 48.4 48.4 40 50 18 Z"
        fill={WHITE}
        opacity={0.75}
      />
    </g>
    <path
      d="M50 2 C52.6 38 62 47.4 98 50 C62 52.6 52.6 62 50 98 C47.4 62 38 52.6 2 50 C38 47.4 47.4 38 50 2 Z"
      fill={WHITE}
    />
    <path d="M14 14 C14.5 18 16 19.5 20 20 C16 20.5 14.5 22 14 26 C13.5 22 12 20.5 8 20 C12 19.5 13.5 18 14 14 Z" fill={WHITE} />
    <path d="M86 76 C86.4 79 87.6 80.2 90.6 80.6 C87.6 81 86.4 82.2 86 85.2 C85.6 82.2 84.4 81 81.4 80.6 C84.4 80.2 85.6 79 86 76 Z" fill={WHITE} />
  </svg>
);

/** '별빛' — 아주 옅은 잔별. 시드 고정이라 렌더마다 같은 자리. */
const StarField: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 70 }).map((_, i) => {
      const x = random(`sx${i}`) * 100;
      const y = random(`sy${i}`) * 100;
      const s = 1 + random(`ss${i}`) * 2.2;
      const base = 0.08 + random(`sa${i}`) * 0.22;
      // 아주 느린 반짝임
      const tw = 0.65 + 0.35 * Math.sin(frame / 14 + random(`sp${i}`) * 6.28);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: s,
            height: s,
            borderRadius: "50%",
            background: WHITE,
            opacity: interpolate(base * tw, [0, 1], [0, 1], clamp),
          }}
        />
      );
    })}
  </AbsoluteFill>
);
