import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Chars } from "../ti/kinetic";
import { KR } from "../ti/fonts";
import { Grain } from "../lib/film";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const weddingPhotoSchema = z.object({
  /** 1행 — 상황 */
  line1: z.string(),
  /** 2행 — 부정 */
  line2: z.string(),
  /** 3행 앞머리. 이 컷의 전환점이라 가장 밝게 둔다. */
  pivot: z.string(),
  /** 3행 나머지 */
  line3: z.string(),
});

export type WeddingPhotoProps = z.infer<typeof weddingPhotoSchema>;

/* 사진 속 신부가 지워지는 구간 */
const FADE_IN = 152;
const FADE_OUT = 214;

/**
 * 딸 결혼식 사진인데 본인만 보였다는 한 문장.
 *
 * 말로 설명하지 않고 화면이 직접 보여준다 — "우리 딸이 아니라"가 찍히는 순간
 * 사진 속 신부가 지워지기 시작하고, "저만"에 이르면 한 사람만 남는다.
 * 프레임은 그대로인데 사람이 하나 없어진 사진이 남는 게 이 컷의 전부다.
 */
export const WeddingPhoto: React.FC<WeddingPhotoProps> = ({
  line1,
  line2,
  pivot,
  line3,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const printIn = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 200, mass: 0.9, stiffness: 80 },
  });
  const figuresIn = interpolate(frame, [34, 62], [0, 1], clamp);

  // 신부가 사라진다.
  const bride = 1 - interpolate(frame, [FADE_IN, FADE_OUT], [0, 1], clamp);
  // 남은 사람은 아주 조금 또렷해진다. 밝아지는 게 아니라 남겨지는 것이다.
  const mother = interpolate(frame, [FADE_OUT, 252], [1, 1.12], clamp);
  const motherBlur = interpolate(frame, [FADE_OUT, 252], [8.5, 6.5], clamp);

  const out = interpolate(
    frame,
    [durationInFrames - 38, durationInFrames - 1],
    [1, 0],
    clamp
  );

  return (
    <AbsoluteFill style={{ background: "#100C09", opacity: out }}>
      {/* ── 바닥 ─────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 58% at 50% 34%, #241A12 0%, #17110C 52%, #0C0907 100%)",
        }}
      />

      {/* ── 인화지 ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: (width - 780) / 2,
          top: 148,
          width: 780,
          padding: 20,
          background: "#F6F1E8",
          transform: `rotate(-1.1deg) scale(${(0.955 + printIn * 0.045).toFixed(4)})`,
          transformOrigin: "50% 44%",
          opacity: printIn,
          boxShadow: "0 30px 64px rgba(0,0,0,0.62)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 740,
            height: 494,
            overflow: "hidden",
            background:
              "linear-gradient(172deg, #E8CDA8 0%, #D7B189 40%, #B98E66 100%)",
          }}
        >
          {/* 예식장 조명 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 62% 48% at 50% 8%, rgba(255,246,226,0.55) 0%, rgba(255,236,204,0.18) 46%, rgba(0,0,0,0) 76%)",
            }}
          />

          {/* 신부 — 지워지는 쪽 */}
          <Figure
            left={196}
            width={212}
            height={428}
            blur={8.5}
            opacity={figuresIn * bride}
            bodyColor="rgba(253,249,243,0.97)"
            headColor="rgba(58,40,30,0.88)"
            dress
          />

          {/* 어머니 — 남는 쪽 */}
          <Figure
            left={412}
            width={168}
            height={376}
            blur={motherBlur}
            opacity={figuresIn * mother}
            bodyColor="rgba(168,116,101,0.94)"
            headColor="rgba(52,36,28,0.88)"
          />

          {/* 인화지 위로 떨어지는 빛 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(118deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 42%)",
            }}
          />
        </div>
      </div>

      {/* ── 문장 ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 772,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Chars
          text={line1}
          delay={54}
          stagger={2.2}
          rise={16}
          blur={9}
          spread={4}
          style={{
            fontFamily: KR,
            fontWeight: 400,
            fontSize: 50,
            lineHeight: 1.5,
            color: "#9A8C7E",
          }}
        />
        <Chars
          text={line2}
          delay={124}
          stagger={2.5}
          rise={16}
          blur={9}
          spread={4}
          style={{
            fontFamily: KR,
            fontWeight: 700,
            fontSize: 50,
            lineHeight: 1.5,
            color: "#C6B6A4",
          }}
        />
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <Chars
            text={pivot}
            delay={190}
            stagger={4}
            rise={20}
            blur={11}
            spread={7}
            style={{
              fontFamily: KR,
              fontWeight: 800,
              fontSize: 62,
              lineHeight: 1.45,
              color: "#F7F1E6",
            }}
          />
          <Chars
            text={line3}
            delay={202}
            stagger={2.5}
            rise={16}
            blur={9}
            spread={4}
            style={{
              fontFamily: KR,
              fontWeight: 700,
              fontSize: 50,
              lineHeight: 1.45,
              color: "#D8C9B8",
            }}
          />
        </div>
      </div>

      <Grain frame={frame} amount={0.5} width={width} height={height} blend="soft-light" />
    </AbsoluteFill>
  );
};

/**
 * 사진 속 사람.
 *
 * 머리 · 어깨 · 치마를 따로 그린 뒤 묶어서 한 번에 흐린다. 원뿔 하나로는
 * 사람으로 안 읽혀서 어깨를 만들어 줘야 한다. 얕은 심도로 찍힌 인물처럼
 * 실루엣만 남기는 게 목적이라 이목구비는 그리지 않는다.
 */
const Figure: React.FC<{
  left: number;
  width: number;
  height: number;
  blur: number;
  opacity: number;
  bodyColor: string;
  headColor: string;
  dress?: boolean;
}> = ({ left, width, height, blur, opacity, bodyColor, headColor, dress }) => {
  const head = width * 0.33;
  const shoulder = width * (dress ? 0.56 : 0.6);
  const torsoTop = head * 1.06;          // 목만큼 띄운다
  const torsoH = height * 0.3;
  const skirtTop = torsoTop + torsoH - 6;

  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom: -14,
        width,
        height,
        filter: `blur(${blur.toFixed(1)}px)`,
        opacity: Math.min(1, opacity),
      }}
    >
      {/* 신부 면사포 — 머리 뒤로 넓게 퍼지는 흰 기운 */}
      {dress ? (
        <div
          style={{
            position: "absolute",
            left: -width * 0.1,
            top: head * 0.2,
            width: width * 1.2,
            height: height * 0.66,
            borderRadius: "50% 50% 44% 44% / 38% 38% 62% 62%",
            background: "rgba(255,252,247,0.5)",
          }}
        />
      ) : null}

      {/* 머리 */}
      <div
        style={{
          position: "absolute",
          left: (width - head) / 2,
          top: 0,
          width: head,
          height: head * 1.2,
          borderRadius: "50% 50% 46% 46%",
          background: headColor,
        }}
      />

      {/* 어깨와 상체 */}
      <div
        style={{
          position: "absolute",
          left: (width - shoulder) / 2,
          top: torsoTop,
          width: shoulder,
          height: torsoH,
          borderRadius: `${shoulder * 0.42}px ${shoulder * 0.42}px 0 0`,
          background: bodyColor,
        }}
      />

      {/* 아래로 퍼지는 치마 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: skirtTop,
          width,
          height: height - skirtTop,
          background: bodyColor,
          clipPath: dress
            ? `polygon(${((width - shoulder) / 2 / width) * 100}% 0%, ${((width + shoulder) / 2 / width) * 100}% 0%, 100% 100%, 0% 100%)`
            : `polygon(${((width - shoulder) / 2 / width) * 100}% 0%, ${((width + shoulder) / 2 / width) * 100}% 0%, 88% 100%, 12% 100%)`,
        }}
      />

      {/* 부케 */}
      {dress ? (
        <div
          style={{
            position: "absolute",
            left: width * 0.34,
            top: skirtTop + 4,
            width: width * 0.32,
            height: width * 0.26,
            borderRadius: "50%",
            background: "rgba(226,178,178,0.72)",
          }}
        />
      ) : null}
    </div>
  );
};
