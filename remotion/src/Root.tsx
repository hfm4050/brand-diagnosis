import React from "react";
import { Composition } from "remotion";
import { TiSurgery } from "./ti/TiSurgery";
import { FPS, TOTAL } from "./ti/theme";
import { PhotoShot, photoShotSchema } from "./shot/PhotoShot";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TiSurgery"
        component={TiSurgery}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* 사진 한 장에 카메라와 필름을 입히는 8초 컷. */}
      <Composition
        id="PhotoShot"
        component={PhotoShot}
        durationInFrames={8 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={photoShotSchema}
        defaultProps={{
          src: "",
          pushIn: 1.07,
          beamFrom: "left" as const,
          warmth: 0.85,
          grain: 0.55,
          motes: 54,
        }}
      />
    </>
  );
};
