import React from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Img,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { CREEPY, GOTHIC } from "../ti/fonts";
import { Grain } from "../lib/film";

export const sawHorrorSchema = z.object({
  /** 톱날 클로즈업 스틸. public/ 기준. */
  closeSrc: z.string(),
  /** 교수님 미디엄 샷 스틸. public/ 기준. */
  profSrc: z.string(),
  /** 네온 간판 두 줄 */
  sign1: z.string(),
  sign2: z.string(),
  /** 간판 아래 작은 줄 */
  subline: z.string(),
});
export type SawHorrorProps = z.infer<typeof sawHorrorSchema>;

/** 5초 */
export const HORROR_DURATION = 150;

/* ── 타임라인 (프레임 @30fps) ─────────────────────────────── */
const CUT = 54; // 클로즈업 → 교수님
const STROKES_A = [4, 16, 28, 40]; // 쓱 싹 쓱 싹
const STROKES_B = [62, 74, 86, 98, 110];
const SPLAT_AT = 41;
const ZAPS = [66, 72]; // 간판이 지지직
const SIGN_ON = 76; // 이후로 켜져 있다
const RISER_AT = 96; // 0.85초짜리 → 121에서 끝
const STING = 121; // 쾅. 이후 방 불이 꺼지고 간판만 남는다.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 1920;
const H = 1080;

/**
 * 할로윈 호러 테마파크 컨셉의 톱질 컷.
 *
 * 원본은 스틸 두 장뿐이라 팔이 실제로 움직이지는 않는다. 대신 톱질 박자에
 * 맞춰 화면이 밀리고 뼛가루가 튀고 소리가 나서 "쓱싹" 리듬을 만든다.
 * 끝에서는 방 불이 꺼지고 네온 간판만 남는다 — 테마파크 밤의 마지막 장면.
 */
export const SawHorror: React.FC<SawHorrorProps> = (props) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#050306" }}>
      {frame < CUT ? <ShotClose src={props.closeSrc} /> : <ShotProf {...props} />}

      {/* 컷 전환 — 붉은 섬광 */}
      <AbsoluteFill
        style={{
          background: "#C0001A",
          mixBlendMode: "screen",
          // 컷 직전에 0을 명시해야 한다 — clamp 는 왼쪽 경계값(0.75)을 컷 이전 전체에 붙잡는다.
          opacity: interpolate(frame, [CUT - 1, CUT, CUT + 9], [0, 0.75, 0], clamp),
          pointerEvents: "none",
        }}
      />

      <Grain frame={frame} amount={0.65} width={W} height={H} />

      <Soundtrack />
    </AbsoluteFill>
  );
};

/* ── 샷 1: 톱날 클로즈업 ──────────────────────────────────── */

/** 원본 1464×801 에서 자막(y≈645부터) 위쪽 20~630 만 16:9로 잘라 쓴다. */
const CLOSE = { srcW: 1464, x: 188, y: 20, w: 1084 };
const CLOSE_S = W / CLOSE.w;
/** 톱날이 해골에 닿는 지점(화면 좌표) */
const CLOSE_CUTPOINT = { x: (720 - CLOSE.x) * CLOSE_S, y: (395 - CLOSE.y) * CLOSE_S };

const ShotClose: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, CUT], [1.02, 1.08], clamp);
  const { dx, dy } = strokeShake(frame, STROKES_A, 9);
  const fadeIn = interpolate(frame, [0, 6], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${push.toFixed(4)})`,
          transformOrigin: `${CLOSE_CUTPOINT.x}px ${CLOSE_CUTPOINT.y}px`,
        }}
      >
        <Graded frame={frame}>
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              left: -CLOSE.x * CLOSE_S,
              top: -CLOSE.y * CLOSE_S,
              width: CLOSE.srcW * CLOSE_S,
            }}
          />
        </Graded>
        <Dust strokes={STROKES_A} at={CLOSE_CUTPOINT} count={16} redFrom={2} />
      </AbsoluteFill>

      <Splatter at={SPLAT_AT} x={1490} y={70} size={250} seed={7} />
      <NightLight frame={frame} />
    </AbsoluteFill>
  );
};

/* ── 샷 2: 교수님 ─────────────────────────────────────────── */

/** 원본 1354×800 을 꽉 채운다. */
const PROF_S = W / 1354;
const PROF_TOP = -(800 * PROF_S - H) / 2;
const PROF_CUTPOINT = { x: 790 * PROF_S, y: 700 * PROF_S + PROF_TOP };

const ShotProf: React.FC<SawHorrorProps> = ({ profSrc, sign1, sign2, subline }) => {
  const frame = useCurrentFrame();
  const local = frame - CUT;
  const push = interpolate(frame, [CUT, HORROR_DURATION], [1.03, 1.1], clamp);
  const { dx, dy } = strokeShake(frame, STROKES_B, 4.5);

  // 스팅어 — 화면이 한 번 훅 당겨졌다 돌아온다
  const punch = interpolate(frame, [STING, STING + 2, STING + 12], [0, 0.045, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  // 스팅어 뒤로 방 불이 죽는다. 간판만 남는다.
  const lightsOut = interpolate(frame, [STING + 6, HORROR_DURATION - 4], [1, 0.22], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(push + punch).toFixed(4)})`,
          transformOrigin: "1080px 480px",
        }}
      >
        <Graded frame={frame} dim={lightsOut}>
          <Img
            src={staticFile(profSrc)}
            style={{ position: "absolute", left: 0, top: PROF_TOP, width: W }}
          />
        </Graded>
        <Dust strokes={STROKES_B} at={PROF_CUTPOINT} count={11} redFrom={3} />
      </AbsoluteFill>

      <Drips start={CUT + 8} />
      <Bats start={SIGN_ON + 2} />
      <Fog frame={frame} />
      <NightLight frame={frame} />

      {/* 스팅어 — 붉은 비네팅이 한 번 조인다 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 62% at 50% 50%, rgba(0,0,0,0) 30%, rgba(150,0,18,0.9) 100%)",
          opacity: interpolate(frame, [STING, STING + 3, STING + 26], [0, 0.85, 0.3], clamp),
          pointerEvents: "none",
        }}
      />

      <NeonSign frame={frame} local={local} sign1={sign1} sign2={sign2} subline={subline} />
    </AbsoluteFill>
  );
};

/* ── 그레이딩 · 조명 ──────────────────────────────────────── */

/** 고장 난 조명처럼 가끔 훅 꺼졌다 켜진다. 간판이 지지직할 땐 방도 같이 떤다. */
const lightFlicker = (frame: number) => {
  const r = random(`fl${frame}`);
  let v = r < 0.07 ? 0.55 + r * 4 : 1;
  for (const z of ZAPS) if (frame >= z && frame < z + 6) v *= 0.6 + 0.4 * random(`zf${frame}`);
  return v;
};

/** 밤의 호러 테마파크 톤 — 채도를 빼고, 보라-빨강으로 물들이고, 어둡게. */
const Graded: React.FC<{ frame: number; dim?: number; children: React.ReactNode }> = ({
  frame,
  dim = 1,
  children,
}) => {
  const b = 0.8 * lightFlicker(frame) * dim;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `contrast(1.18) saturate(0.6) brightness(${b.toFixed(3)})` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, #8C6AA6 0%, #9A5C78 55%, #7A3E48 100%)",
          mixBlendMode: "multiply",
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};

/** 테마파크 조명 — 왼쪽 아래 빨강, 오른쪽 위 마젠타, 무거운 비네팅 */
const NightLight: React.FC<{ frame: number }> = ({ frame }) => {
  const pulse = 0.85 + 0.15 * Math.sin(frame / 7);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 0% 100%, rgba(255,25,35,${(0.42 * pulse).toFixed(3)}) 0%, rgba(255,25,35,0) 70%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 50% 55% at 100% 0%, rgba(200,40,190,0.3) 0%, rgba(200,40,190,0) 70%)",
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 78% 72% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 바닥에 깔린 안개가 천천히 흐른다 */
const Fog: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {[0, 1].map((k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: -300 + ((frame * (k ? 1.4 : 0.9)) % 300) - k * 150,
          bottom: -120,
          width: W + 600,
          height: 420,
          background:
            "radial-gradient(ellipse 45% 50% at 30% 70%, rgba(210,190,230,0.16) 0%, rgba(210,190,230,0) 70%), radial-gradient(ellipse 40% 45% at 75% 75%, rgba(210,190,230,0.12) 0%, rgba(210,190,230,0) 70%)",
          filter: "blur(18px)",
        }}
      />
    ))}
  </AbsoluteFill>
);

/* ── 톱질 ─────────────────────────────────────────────────── */

/** 박자마다 밀고 당기기 — 짝수는 오른쪽, 홀수는 왼쪽 */
const strokeShake = (frame: number, strokes: number[], amp: number) => {
  let dx = 0, dy = 0;
  strokes.forEach((s, i) => {
    const t = frame - s;
    if (t >= 0 && t < 12) {
      const dir = i % 2 ? -1 : 1;
      dx += dir * amp * Math.sin((Math.PI * t) / 12);
      dy += (random(`sy${frame}`) - 0.5) * amp * 0.35;
    }
  });
  return { dx, dy };
};

/** 박자마다 톱날 지점에서 뼛가루가 튄다. redFrom 번째 박자부터는 핏방울도 섞인다. */
const Dust: React.FC<{
  strokes: number[];
  at: { x: number; y: number };
  count: number;
  redFrom: number;
}> = ({ strokes, at, count, redFrom }) => {
  const frame = useCurrentFrame();
  const parts: React.ReactNode[] = [];
  strokes.forEach((s, si) => {
    const t = frame - s;
    if (t < 0 || t >= 20) return;
    const dir = si % 2 ? -1 : 1;
    for (let k = 0; k < count; k += 1) {
      const key = `d${si}-${k}`;
      const a = (dir > 0 ? 0 : Math.PI) + (random(`${key}a`) - 0.5) * 1.3 - dir * 0.25;
      const v = 6 + random(`${key}v`) * 11;
      const x = at.x + Math.cos(a) * v * t;
      const y = at.y + (Math.sin(a) * v - 3) * t + 0.45 * t * t;
      const red = si >= redFrom && k % 3 === 0;
      const size = red ? 4 + random(`${key}s`) * 6 : 2 + random(`${key}s`) * 4;
      parts.push(
        <div
          key={key}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: "50%",
            background: red ? "#B0001C" : "#F3EDE2",
            opacity: (1 - t / 20) * (red ? 0.95 : 0.8),
            boxShadow: red ? undefined : "0 0 6px rgba(255,240,220,0.6)",
          }}
        />
      );
    }
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{parts}</AbsoluteFill>;
};

/* ── 피 ───────────────────────────────────────────────────── */

/** 시드 고정 핏자국 — 덩어리 + 튄 방울 + 흘러내리는 줄기 */
const Splatter: React.FC<{ at: number; x: number; y: number; size: number; seed: number }> = ({
  at,
  x,
  y,
  size,
  seed,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const pop = interpolate(t, [0, 3, 6], [0.3, 1.12, 1], clamp);

  // 울퉁불퉁한 덩어리
  const pts = 26;
  const ring = Array.from({ length: pts }, (_, i) => {
    const a = (i / pts) * Math.PI * 2;
    const r = size * 0.32 * (0.72 + 0.55 * random(`b${seed}-${i}`));
    return [size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r];
  });
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M ${mid(ring[pts - 1], ring[0]).join(" ")}`;
  ring.forEach((p, i) => {
    const m = mid(p, ring[(i + 1) % pts]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  });

  const drops = Array.from({ length: 16 }, (_, i) => {
    const a = random(`da${seed}-${i}`) * Math.PI * 2;
    const dist = size * (0.36 + random(`dd${seed}-${i}`) * 0.3);
    return {
      cx: size / 2 + Math.cos(a) * dist,
      cy: size / 2 + Math.sin(a) * dist,
      r: 2 + random(`dr${seed}-${i}`) * size * 0.04,
    };
  });

  const drip = (i: number) =>
    interpolate(t, [4, 60], [0, size * (0.5 + 0.45 * random(`dl${seed}-${i}`))], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    });

  return (
    <svg
      width={size}
      height={size * 2}
      viewBox={`0 0 ${size} ${size * 2}`}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y,
        transform: `scale(${pop.toFixed(3)})`,
        transformOrigin: `${size / 2}px ${size / 2}px`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))",
      }}
    >
      <defs>
        <radialGradient id={`bl${seed}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#D4142E" />
          <stop offset="60%" stopColor="#8E0016" />
          <stop offset="100%" stopColor="#56000C" />
        </radialGradient>
      </defs>
      {[0.36, 0.5, 0.63].map((px, i) => (
        <rect
          key={i}
          x={size * px - 6}
          y={size * 0.55}
          width={12 - i * 2}
          height={drip(i)}
          rx={6}
          fill="#8E0016"
        />
      ))}
      <path d={d} fill={`url(#bl${seed})`} />
      {drops.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#9A0018" />
      ))}
      <ellipse cx={size * 0.43} cy={size * 0.41} rx={size * 0.045} ry={size * 0.02} fill="#fff" opacity={0.12} />
    </svg>
  );
};

/** 화면 위쪽에서 흘러내리는 피. 네온 간판(x 90~580)과 얼굴(x 960~1380) 위는 피한다. */
const DRIPS = [
  { x: 24, w: 16, len: 190, delay: 3 },
  { x: 612, w: 20, len: 320, delay: 0 },
  { x: 770, w: 11, len: 170, delay: 9 },
  { x: 905, w: 10, len: 60, delay: 6 },
  { x: 1430, w: 12, len: 110, delay: 4 },
  { x: 1560, w: 20, len: 290, delay: 1 },
  { x: 1760, w: 12, len: 200, delay: 7 },
  { x: 1880, w: 16, len: 330, delay: 2 },
];

const Drips: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* 위쪽 가장자리를 덮은 핏자국 띠 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: interpolate(frame, [start, start + 10], [0, 26], clamp),
          background: "linear-gradient(180deg, #5E000C, #8E0016)",
        }}
      />
      {DRIPS.map((d, i) => {
        const len = interpolate(frame, [start + d.delay, start + d.delay + 70], [0, d.len], {
          ...clamp,
          easing: Easing.out(Easing.quad),
        });
        if (len <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: d.x, top: 0 }}>
            <div
              style={{
                width: d.w,
                height: len + 20,
                background: "linear-gradient(90deg, #6A000F, #A3001C 45%, #6A000F)",
                borderRadius: `0 0 ${d.w}px ${d.w}px`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -d.w * 0.2,
                top: len + 20 - d.w * 0.8,
                width: d.w * 1.4,
                height: d.w * 1.6,
                borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                background: "radial-gradient(circle at 35% 35%, #C8102A, #7A0012)",
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ── 박쥐 ─────────────────────────────────────────────────── */

const BAT_PATH =
  "M50 30 C46 22 40 20 36 24 C30 14 18 12 0 18 C10 22 14 30 14 38 C22 32 30 34 34 40 C38 34 44 34 50 40 C56 34 62 34 66 40 C70 34 78 32 86 38 C86 30 90 22 100 18 C82 12 70 14 64 24 C60 20 54 22 50 30 Z";

const BATS = [
  { y: 150, size: 92, speed: 30, delay: 0, phase: 0 },
  { y: 250, size: 64, speed: 24, delay: 8, phase: 1.7 },
  { y: 110, size: 54, speed: 27, delay: 18, phase: 3.1 },
];

const Bats: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {BATS.map((b, i) => {
        const t = frame - start - b.delay;
        if (t < 0) return null;
        const x = W + 80 - t * b.speed;
        const y = b.y + Math.sin(t / 6 + b.phase) * 22 - t * 0.6;
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(t / 2.2 + b.phase));
        return (
          <svg
            key={i}
            width={b.size}
            height={b.size * 0.55}
            viewBox="0 0 100 55"
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `scaleY(${flap.toFixed(3)})`,
              filter: "drop-shadow(0 0 6px rgba(255,30,40,0.75))",
            }}
          >
            <path d={BAT_PATH} fill="#0A0508" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

/* ── 네온 간판 ────────────────────────────────────────────── */

/** 0 = 꺼짐, 1 = 켜짐. 지지직 두 번 뒤 켜지고, 켜진 뒤에도 미세하게 떤다. */
const signLevel = (frame: number) => {
  if (frame < ZAPS[0]) return 0;
  if (frame < SIGN_ON) {
    const inZap = ZAPS.some((z) => frame >= z && frame < z + 6);
    return inZap ? (random(`sg${frame}`) < 0.55 ? 1 : 0.08) : 0.08;
  }
  // 켜진 뒤 — 아주 가끔 한 프레임 꺼진다
  const r = random(`so${frame}`);
  const base = r < 0.04 ? 0.35 : 0.9 + 0.1 * random(`sb${frame}`);
  const surge = interpolate(frame, [STING, STING + 2, STING + 16], [0, 0.55, 0], clamp);
  return base + surge;
};

const NeonSign: React.FC<{
  frame: number;
  local: number;
  sign1: string;
  sign2: string;
  subline: string;
}> = ({ frame, sign1, sign2, subline }) => {
  const lv = signLevel(frame);
  const on = Math.min(lv, 1);
  const g = lv; // 서지 때 1을 넘겨 더 번진다

  const red = (txt: string, size: number) => (
    <div
      style={{
        fontFamily: CREEPY,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: "0.04em",
        color: on > 0.5 ? "#FFE3E3" : "#3A0A0C",
        WebkitTextStroke: `2px ${on > 0.5 ? "#FF3B3B" : "#4A0C10"}`,
        textShadow:
          on > 0.5
            ? [
                `0 0 ${4 * g}px #FF2A2A`,
                `0 0 ${12 * g}px #FF0000`,
                `0 0 ${28 * g}px #FF0000`,
                `0 0 ${60 * g}px #C00000`,
                `0 0 ${110 * g}px rgba(200,0,0,0.6)`,
              ].join(", ")
            : "none",
      }}
    >
      {txt}
    </div>
  );

  return (
    <div style={{ position: "absolute", left: 92, top: 70 }}>
      {/* 간판 뒤 벽에 번지는 빛 */}
      <div
        style={{
          position: "absolute",
          left: -120,
          top: -100,
          width: 720,
          height: 560,
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,20,30,0.38) 0%, rgba(255,20,30,0) 70%)",
          opacity: on * Math.min(1.4, g),
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", transform: "rotate(-3deg)" }}>
        {red(sign1, 150)}
        {red(sign2, 150)}
        <div
          style={{
            marginTop: 18,
            fontFamily: GOTHIC,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: "0.42em",
            color: on > 0.5 ? "#FBE6FF" : "#2A0A2A",
            textShadow:
              on > 0.5
                ? `0 0 ${6 * g}px #E040FB, 0 0 ${16 * g}px #C000E0, 0 0 ${34 * g}px #8E00B0`
                : "none",
          }}
        >
          {subline}
        </div>
      </div>
    </div>
  );
};

/* ── 사운드 ───────────────────────────────────────────────── */

const Sfx: React.FC<{ at: number; file: string; volume: number; dur?: number }> = ({
  at,
  file,
  volume,
  dur = 90,
}) => (
  <Sequence from={at} durationInFrames={dur} layout="none">
    <Html5Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
  </Sequence>
);

const Soundtrack: React.FC = () => (
  <>
    {/* 배경음은 바닥에 깐다 — 톱질 박자와 붐·스팅어가 앞에 서야 한다 */}
    <Sfx at={0} file="horror-bgm" volume={0.3} dur={HORROR_DURATION} />
    {STROKES_A.map((s, i) => (
      <Sfx key={`a${i}`} at={s} file={i % 2 ? "horror-saw-pull" : "horror-saw-push"} volume={0.6} dur={12} />
    ))}
    <Sfx at={SPLAT_AT} file="horror-splat" volume={0.6} dur={30} />
    <Sfx at={CUT} file="horror-boom" volume={0.7} />
    {STROKES_B.map((s, i) => (
      <Sfx key={`b${i}`} at={s} file={i % 2 ? "horror-saw-pull" : "horror-saw-push"} volume={0.45} dur={12} />
    ))}
    <Sfx at={ZAPS[0]} file="horror-zap-a" volume={0.35} dur={10} />
    <Sfx at={ZAPS[1]} file="horror-zap-b" volume={0.35} dur={10} />
    <Sfx at={ZAPS[0]} file="horror-buzz" volume={0.1} dur={HORROR_DURATION - ZAPS[0]} />
    <Sfx at={RISER_AT} file="horror-riser" volume={0.45} dur={STING - RISER_AT + 1} />
    <Sfx at={STING} file="horror-stinger" volume={0.95} dur={HORROR_DURATION - STING} />
  </>
);
