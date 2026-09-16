import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caliper, Chars, Progress, Rule, Scene, VRule } from "./kinetic";
import { KR, LATIN } from "./fonts";
import { Axis } from "./content";
import { D, INK, INK_FAINT, INK_SOFT, LOUD, RULE, RULE_HAIR } from "./theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const kicker: React.CSSProperties = {
  fontFamily: LATIN,
  fontWeight: 600,
  fontSize: 21,
  letterSpacing: "0.36em",
  textTransform: "uppercase",
  color: INK_FAINT,
};

const center: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

/** 늦게 스며드는 한 줄. 본문 주석용. */
const Fade: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 20], [0, 1], clamp);
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${((1 - t) * 12).toFixed(2)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ── 1. 표제 ──────────────────────────────────────────────── */
export const Title: React.FC = () => (
  <Scene duration={D.title}>
    <AbsoluteFill style={{ ...center, gap: 0 }}>
      <Fade delay={0} style={{ marginBottom: 54 }}>
        <div style={kicker}>Aesthetic Surgery &middot; 판별 기준</div>
      </Fade>

      <Chars
        text="티나는 성형"
        delay={16}
        stagger={5}
        rise={34}
        spread={14}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 132,
          lineHeight: 1.08,
          color: LOUD,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 30,
          width: 900,
          margin: "22px 0",
        }}
      >
        <Rule delay={50} origin="right" style={{ flex: 1 }} />
        <Fade delay={56}>
          <span
            style={{
              fontFamily: LATIN,
              fontStyle: "italic",
              fontSize: 27,
              letterSpacing: "0.24em",
              color: INK_FAINT,
            }}
          >
            versus
          </span>
        </Fade>
        <Rule delay={50} origin="left" style={{ flex: 1 }} />
      </div>

      <Chars
        text="티 안 나는 성형"
        delay={66}
        stagger={5.5}
        rise={34}
        spread={14}
        damping={230}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 132,
          lineHeight: 1.08,
          color: INK,
        }}
      />

      <div style={{ marginTop: 58 }}>
        <Caliper delay={104} width={1180} />
      </div>
    </AbsoluteFill>
  </Scene>
);

/* ── 2. 논지 ──────────────────────────────────────────────── */
export const Thesis: React.FC = () => (
  <Scene duration={D.thesis}>
    <AbsoluteFill style={center}>
      <Chars
        text="티는 얼마나 했느냐가 아니라"
        delay={6}
        stagger={2.6}
        style={{
          fontFamily: KR,
          fontWeight: 400,
          fontSize: 66,
          lineHeight: 1.5,
          color: INK_SOFT,
        }}
      />
      <Chars
        text="얼마나 어긋났느냐에서 난다"
        delay={44}
        stagger={2.6}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.5,
          color: INK,
        }}
      />

      <Rule delay={86} style={{ width: 340, margin: "52px 0" }} />

      <Fade delay={96}>
        <div
          style={{
            fontFamily: KR,
            fontWeight: 400,
            fontSize: 32,
            color: INK_SOFT,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          얼굴은 부위의 합이 아니라 비율이어서,
          <br />한 곳만 남의 기준으로 바꾸면 나머지 전부와 어긋난다.
        </div>
      </Fade>

      <Fade delay={122} style={{ marginTop: 34 }}>
        <div
          style={{
            fontFamily: KR,
            fontWeight: 700,
            fontSize: 32,
            color: INK,
          }}
        >
          그 어긋남을 사람들은{" "}
          <span
            style={{
              fontFamily: LATIN,
              fontStyle: "italic",
              fontWeight: 600,
              color: LOUD,
            }}
          >
            1~2mm
          </span>{" "}
          단위로 알아본다.
        </div>
      </Fade>
    </AbsoluteFill>
  </Scene>
);

/* ── 3~8. 여섯 축 ─────────────────────────────────────────── */
export const AxisScene: React.FC<{ axis: Axis; index: number }> = ({
  axis,
  index,
}) => (
  <Scene duration={D.axis}>
    <AbsoluteFill
      style={{
        padding: "112px 132px 78px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 축 이름 — 좌우로 괘선이 뻗는다 */}
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <Rule delay={4} origin="right" color={RULE_HAIR} style={{ flex: 1 }} />
        <Chars
          text={`${axis.name} · ${axis.sub}`}
          delay={0}
          stagger={1.7}
          rise={14}
          blur={9}
          spread={3}
          style={{
            fontFamily: KR,
            fontWeight: 700,
            fontSize: 31,
            letterSpacing: "0.18em",
            color: INK,
          }}
        />
        <Rule delay={4} origin="left" color={RULE_HAIR} style={{ flex: 1 }} />
      </div>

      {/* 두 열 */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          columnGap: 96,
          alignItems: "center",
          paddingBlock: 46,
        }}
      >
        <div>
          <Fade delay={20}>
            <div style={{ ...kicker, fontSize: 17, color: LOUD }}>
              티나는 성형
            </div>
          </Fade>
          <Chars
            text={axis.loud.lede}
            delay={26}
            stagger={2.6}
            rise={24}
            style={{
              fontFamily: KR,
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1.36,
              color: LOUD,
              marginTop: 22,
            }}
          />
          <Fade delay={26 + axis.loud.lede.length * 2.6 + 8}>
            <div
              style={{
                fontFamily: KR,
                fontWeight: 400,
                fontSize: 27,
                lineHeight: 1.85,
                color: INK_SOFT,
                marginTop: 24,
              }}
            >
              {axis.loud.note}
            </div>
          </Fade>
        </div>

        <VRule delay={20} color={RULE_HAIR} />

        <div>
          <Fade delay={52}>
            <div style={{ ...kicker, fontSize: 17, color: INK_FAINT }}>
              티 안 나는 성형
            </div>
          </Fade>
          <Chars
            text={axis.calm.lede}
            delay={58}
            stagger={2.8}
            rise={24}
            damping={230}
            style={{
              fontFamily: KR,
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1.36,
              color: INK,
              marginTop: 22,
            }}
          />
          <Fade delay={58 + axis.calm.lede.length * 2.8 + 8}>
            <div
              style={{
                fontFamily: KR,
                fontWeight: 400,
                fontSize: 27,
                lineHeight: 1.85,
                color: INK_SOFT,
                marginTop: 24,
              }}
            >
              {axis.calm.note}
            </div>
          </Fade>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <Fade delay={16}>
          <span
            style={{
              fontFamily: LATIN,
              fontSize: 17,
              letterSpacing: "0.3em",
              color: INK_FAINT,
            }}
          >
            {String(index + 1).padStart(2, "0")} / 06
          </span>
        </Fade>
        <Progress index={index} delay={16} />
      </div>
    </AbsoluteFill>
  </Scene>
);

/* ── 9. 티 판정 ───────────────────────────────────────────── */
export const Tell: React.FC = () => (
  <Scene duration={D.tell}>
    <AbsoluteFill style={center}>
      <Fade delay={0} style={{ marginBottom: 56 }}>
        <div style={kicker}>The Tell &middot; 티는 이 한 마디로 갈린다</div>
      </Fade>

      <Chars
        text="“너 어디 했어?”"
        delay={14}
        stagger={4.2}
        rise={30}
        spread={10}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.3,
          color: LOUD,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          width: 760,
          margin: "26px 0",
        }}
      >
        <Rule delay={58} origin="right" style={{ flex: 1 }} />
        <Fade delay={62}>
          <span
            style={{
              fontFamily: LATIN,
              fontStyle: "italic",
              fontSize: 24,
              letterSpacing: "0.24em",
              color: INK_FAINT,
            }}
          >
            versus
          </span>
        </Fade>
        <Rule delay={58} origin="left" style={{ flex: 1 }} />
      </div>

      <Chars
        text="“요즘 좋아 보이네.”"
        delay={66}
        stagger={4.0}
        rise={30}
        spread={10}
        damping={230}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.3,
          color: INK,
        }}
      />

      <Fade delay={118} style={{ marginTop: 56 }}>
        <div
          style={{
            fontFamily: KR,
            fontWeight: 400,
            fontSize: 30,
            lineHeight: 1.8,
            color: INK_SOFT,
            textAlign: "center",
          }}
        >
          목표는 바뀐 얼굴이 아니라,
          <br />
          바뀐 걸 아무도 짚어내지 못하는 얼굴이다.
        </div>
      </Fade>
    </AbsoluteFill>
  </Scene>
);

/* ── 10. 엔드 카드 ────────────────────────────────────────── */
export const EndCard: React.FC = () => (
  <Scene duration={D.end} fadeOut={26}>
    <AbsoluteFill style={center}>
      <Chars
        text="티나는 성형"
        delay={2}
        stagger={3}
        rise={20}
        spread={9}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 74,
          color: LOUD,
        }}
      />
      <Chars
        text="티 안 나는 성형"
        delay={22}
        stagger={3}
        rise={20}
        spread={9}
        style={{
          fontFamily: KR,
          fontWeight: 800,
          fontSize: 74,
          color: INK,
          marginTop: 6,
        }}
      />

      <div style={{ marginTop: 46 }}>
        <Caliper delay={46} width={860} />
      </div>

      <Fade delay={62} style={{ marginTop: 44 }}>
        <div
          style={{
            fontFamily: KR,
            fontWeight: 400,
            fontSize: 21,
            lineHeight: 1.85,
            color: INK_FAINT,
            textAlign: "center",
            maxWidth: 980,
          }}
        >
          미용적 관점의 일반론입니다. 실제 수술 가능 범위와 위험은 골격·피부
          두께·병력에 따라 달라지므로,
          <br />
          결정 전 성형외과 전문의 상담이 필요합니다.
        </div>
      </Fade>
    </AbsoluteFill>
  </Scene>
);

export const SCENE_RULE_COLOR = RULE;
