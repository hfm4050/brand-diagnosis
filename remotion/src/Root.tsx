import React from "react";
import { Composition } from "remotion";
import { MyComposition, myCompSchema } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      schema={myCompSchema}
      defaultProps={{
        title: "브랜드 · 채널 진단",
        subtitle: "나에게 맞는 채널을 찾는 가장 빠른 방법",
      }}
    />
  );
};
