import React from "react";
import { Composition } from "remotion";
import { TiSurgery } from "./ti/TiSurgery";
import { FPS, TOTAL } from "./ti/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TiSurgery"
      component={TiSurgery}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
