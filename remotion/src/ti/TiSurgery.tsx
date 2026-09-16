import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { AxisScene, EndCard, Tell, Thesis, Title } from "./scenes";
import { AXES } from "./content";
import { D, PAPER } from "./theme";

export const TiSurgery: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Series>
      <Series.Sequence durationInFrames={D.title}>
        <Title />
      </Series.Sequence>

      <Series.Sequence durationInFrames={D.thesis}>
        <Thesis />
      </Series.Sequence>

      {AXES.map((axis, i) => (
        <Series.Sequence key={axis.name} durationInFrames={D.axis}>
          <AxisScene axis={axis} index={i} />
        </Series.Sequence>
      ))}

      <Series.Sequence durationInFrames={D.tell}>
        <Tell />
      </Series.Sequence>

      <Series.Sequence durationInFrames={D.end}>
        <EndCard />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
