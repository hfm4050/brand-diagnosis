import React from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GOTHIC } from "../ti/fonts";
import {
  BRAND,
  CARE,
  CARE_TITLE,
  DAY_STEPS,
  PROGRAM,
  SUBTITLE,
  type CarePhase,
  type DayStep,
} from "./content";

/* 스타라인 아이덴티티 — 다크 그라운드, 오렌지 하나, 흰 볼드 고딕, 4각 스파클 */
const BG = "#121214";
const ORANGE = "#F0682C";
const WHITE = "#FFFFFF";
const MUTED = "#A3A3AB";
const CARD = "rgba(255,255,255,0.045)";

/** 9.5초. 마지막 항목이 자리 잡은 뒤 약 1.8초 머문다. */
export const STARLINE_DURATION = 285;

/**
 * 하나씩 나오는 순서. 각 박자에 효과음이 하나씩 붙는다.
 * 제목 → STEP1 → 2 → 3 → 1~2일차 → 7~14일차 → 1개월차 → 3~6개월차
 */
const BEATS = {
  title: 6,
  steps: [34, 58, 82],
  care: [110, 136, 162, 188],
};
const SFX_AT = [BEATS.title, ...BEATS.steps, ...BEATS.care];
/** 소리가 화면보다 앞서면 어색하다. 2프레임 늦게 울린다. */
const SFX_LAG = 2;
const SFX_VOLUME = 0.28;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 바운스 없이 빠르게 들어와 길게 가라앉는 곡선 — 고급스러움은 대부분 여기서 나온다. */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const useReveal = () => {
  const frame = useCurrentFrame();
  return (start: number, len = 24) =>
    interpolate(frame, [start, start + len], [0, 1], { ...clamp, easing: EASE });
};

/** 블러가 걷히며 올라오는 등장 */
const reveal = (p: number, dist = 26, blur = 10): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${((1 - p) * dist).toFixed(2)}px) scale(${(0.985 + 0.015 * p).toFixed(4)})`,
  filter: p < 0.999 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : undefined,
});

/**
 * 스타라인성형외과 "별빛 프로그램".
 *
 * 위 줄은 수술까지의 흐름(STEP1→2→3), 아래는 그 뒤 6개월(STEP4).
 * 정보량이 STEP4에 몰려 있어서 4칸 균등 분할 대신 두 줄로 나눴다.
 */
export const StarlineSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const r = useReveal();

  // 전체가 아주 천천히 밀려 들어간다.
  const push = 1 + 0.018 * (frame / durationInFrames);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 70% at 18% 0%, #241A16 0%, ${BG} 46%, #0B0B0D 100%)`,
        fontFamily: GOTHIC,
        color: WHITE,
      }}
    >
      <StarField frame={frame} />

      <AbsoluteFill
        style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: "50% 46%" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "50px 80px 56px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header />

          {/* ── STEP 1 → 2 → 3 ───────────────────────────── */}
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "1fr 64px 1fr 64px 1fr",
              alignItems: "stretch",
            }}
          >
            {DAY_STEPS.map((s, i) => (
              <React.Fragment key={s.step}>
                <DayCard step={s} start={BEATS.steps[i]} />
                {i < DAY_STEPS.length - 1 ? (
                  <Connector start={BEATS.steps[i + 1] - 8} />
                ) : null}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 4 ───────────────────────────────────── */}
          <div style={{ marginTop: 36, ...reveal(r(BEATS.care[0] - 6), 16, 8) }}>
            <StepBadge
              step={CARE_TITLE.step}
              title={CARE_TITLE.title}
              shineAt={BEATS.care[0]}
            />
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
              <PhaseCard key={phase.when} phase={phase} start={BEATS.care[i]} />
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* ── 효과음 — 하나 나올 때마다 작게 ──────────────────── */}
      {SFX_AT.map((at, i) => (
        <Sequence key={i} from={at + SFX_LAG} durationInFrames={48} layout="none">
          <Html5Audio src={staticFile(`sfx/star-${i}.wav`)} volume={SFX_VOLUME} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ── 헤더 ─────────────────────────────────────────────────── */

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const r = useReveal();
  const t = BEATS.title;

  // 제목 위로 따뜻한 광택이 한 번 지나간다.
  const c = interpolate(frame, [t + 10, t + 48], [-20, 120], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div style={reveal(r(t, 30), 0, 14)}>
        <Starburst size={92} frame={frame} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: "0.32em",
            color: ORANGE,
            ...reveal(r(t, 26), 12, 6),
          }}
        >
          {BRAND}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 62,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              ...reveal(r(t + 4, 30), 18, 12),
            }}
          >
            <span style={{ color: ORANGE }}>“</span>
            <span
              style={{
                backgroundImage: `linear-gradient(100deg, ${WHITE} 0%, ${WHITE} ${c - 14}%, #FFD9BF ${c}%, ${WHITE} ${c + 14}%, ${WHITE} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {PROGRAM}
            </span>
            <span style={{ color: ORANGE }}>”</span>
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 25,
              color: MUTED,
              ...reveal(r(t + 14, 26), 10, 6),
            }}
          >
            {SUBTITLE}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── 부품 ─────────────────────────────────────────────────── */

/** 오렌지 위로 빛이 한 번 스친다. 부모가 position:relative + 잘림이어야 한다. */
const Shine: React.FC<{ at: number; len?: number }> = ({ at, len = 26 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + len], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  if (t <= 0 || t >= 1) return null;
  const c = -30 + t * 160;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `linear-gradient(105deg, rgba(255,255,255,0) ${c - 16}%, rgba(255,255,255,0.5) ${c}%, rgba(255,255,255,0) ${c + 16}%)`,
      }}
    />
  );
};

/** 카드가 켜질 때 테두리에 오렌지 빛이 잠깐 돌았다 가라앉는다. */
const useActivation = (start: number) => {
  const frame = useCurrentFrame();
  const g = interpolate(frame, [start, start + 10, start + 52], [0, 1, 0], clamp);
  return {
    border: `1px solid rgba(${Math.round(255 - 15 * g)},${Math.round(255 - 151 * g)},${Math.round(255 - 211 * g)},${(0.09 + 0.5 * g).toFixed(3)})`,
    boxShadow: g > 0.01 ? `0 0 ${(46 * g).toFixed(1)}px rgba(240,104,44,${(0.26 * g).toFixed(3)})` : undefined,
  } satisfies React.CSSProperties;
};

/** 오렌지 뱃지 "STEP1 | 듣고 보는 시간" — 원본 화면과 같은 형식 */
const StepBadge: React.FC<{
  step: string;
  title: string;
  size?: number;
  shineAt: number;
}> = ({ step, title, size = 31, shineAt }) => (
  <div
    style={{
      position: "relative",
      overflow: "hidden",
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
    <span style={{ width: 2, height: size * 0.82, background: "rgba(255,255,255,0.85)" }} />
    <span>{title}</span>
    <Shine at={shineAt} />
  </div>
);

const DayCard: React.FC<{ step: DayStep; start: number }> = ({ step, start }) => {
  const r = useReveal();
  const act = useActivation(start);

  return (
    <div
      style={{
        background: CARD,
        padding: "28px 30px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        ...act,
        ...reveal(r(start)),
      }}
    >
      <div>
        <StepBadge step={step.step} title={step.title} size={29} shineAt={start + 6} />
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
                ...reveal(r(start + 8 + i * 3, 18), 10, 5),
              }}
            >
              {i > 0 ? (
                <span style={{ width: 26, height: 2, background: "rgba(255,255,255,0.55)" }} />
              ) : null}
              {f}
            </span>
          ))}
        </div>
      ) : null}

      {step.body ? (
        <div style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.45 }}>
          {step.body.map((line, i) => (
            <div key={line} style={reveal(r(start + 8 + i * 4, 20), 10, 5)}>
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** STEP 사이 — 다음 카드가 나오기 직전에 선이 그어지고 스파클이 박힌다. */
const Connector: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [start, start + 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          top: "50%",
          height: 2,
          background: ORANGE,
          transform: `scaleX(${line.toFixed(3)})`,
          transformOrigin: "left center",
        }}
      />
      <div style={{ position: "relative" }}>
        <PopSparkle at={start + 8} size={30} />
      </div>
    </div>
  );
};

/** 붓으로 칠한 듯한 오렌지 기간 표시 */
const PhasePill: React.FC<{ text: string; shineAt: number }> = ({ text, shineAt }) => (
  <div
    style={{
      position: "relative",
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
    <Shine at={shineAt} />
  </div>
);

const PhaseCard: React.FC<{ phase: CarePhase; start: number }> = ({ phase, start }) => {
  const r = useReveal();
  const act = useActivation(start);

  return (
    <div
      style={{
        background: CARD,
        padding: "30px 30px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 26,
        ...act,
        ...reveal(r(start)),
      }}
    >
      <div>
        <PhasePill text={phase.when} shineAt={start + 6} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 21 }}>
        {phase.items.map((item, i) => {
          const at = start + 10 + i * 4;
          return (
            <div
              key={item.t + i}
              style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
            >
              <div style={{ flexShrink: 0, marginTop: 5 }}>
                <PopSparkle at={at} size={27} />
              </div>
              <div style={reveal(r(at + 1, 20), 10, 5)}>
                <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.25 }}>{item.t}</div>
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
          );
        })}
      </div>
    </div>
  );
};

/* ── 별 ──────────────────────────────────────────────────── */

const SPARKLE =
  "M50 0 C53 32 68 47 100 50 C68 53 53 68 50 100 C47 68 32 53 0 50 C32 47 47 32 50 0 Z";

/** 4각 스파클 — 회전하며 톡 박힌다. 여기만 살짝 튕기게 둔다. */
const PopSparkle: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return <div style={{ width: size, height: size }} />;
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 170, mass: 0.6 } });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        display: "block",
        transform: `scale(${s.toFixed(4)}) rotate(${((1 - s) * -90).toFixed(2)}deg)`,
      }}
    >
      <path d={SPARKLE} fill={WHITE} />
    </svg>
  );
};

/** 좌상단 스타버스트 — 큰 스파클 + 45° 작은 스파클 + 잔별. 아주 천천히 돈다. */
const Starburst: React.FC<{ size: number; frame: number }> = ({ size, frame }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ display: "block", transform: `rotate(${(frame * 0.035).toFixed(3)}deg)` }}
  >
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

/** '별빛' — 아주 옅은 잔별이 느리게 반짝인다. 시드 고정이라 렌더마다 같은 자리. */
const StarField: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 70 }).map((_, i) => {
      const x = random(`sx${i}`) * 100;
      const y = random(`sy${i}`) * 100;
      const s = 1 + random(`ss${i}`) * 2.2;
      const base = 0.08 + random(`sa${i}`) * 0.22;
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
            opacity: base * tw,
          }}
        />
      );
    })}
  </AbsoluteFill>
);
