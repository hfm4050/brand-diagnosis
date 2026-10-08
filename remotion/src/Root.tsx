import React from "react";
import { Composition } from "remotion";
import { TiSurgery } from "./ti/TiSurgery";
import { FPS, TOTAL } from "./ti/theme";
import { PhotoShot, photoShotSchema } from "./shot/PhotoShot";
import { StoryCard, storyCardSchema } from "./story/StoryCard";
import { WeddingPhoto, weddingPhotoSchema } from "./wedding/WeddingPhoto";
import { StarlineSystem } from "./starline/StarlineSystem";

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
          beam: 1,
          warmth: 0.85,
          grain: 0.55,
          motes: 54,
        }}
      />

      {/* 사연 카드 — 사진 없이 전부 도형으로 그린다. */}
      <Composition
        id="StoryCard"
        component={StoryCard}
        durationInFrames={7 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={storyCardSchema}
        defaultProps={{
          badge: "미리보기",
          accent: "#F07E20",
          lines: [
            "결혼식 사진을",
            "나중에 받아봤는데,",
            "우리 딸이 아니라",
            "저만 보이더라고요.",
          ],
          insertSrc: "",
        }}
      />

      {/* 한 문장짜리 컷 — 사진 속에서 딸이 지워진다. */}
      <Composition
        id="WeddingPhoto"
        component={WeddingPhoto}
        durationInFrames={12 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={weddingPhotoSchema}
        defaultProps={{
          line1: "결혼식 사진을 나중에 받아봤는데,",
          line2: "우리 딸이 아니라",
          pivot: "저만",
          line3: " 보이더라고요.",
        }}
      />

      {/* 스타라인 4단계 시스템 — 한 장짜리 + 5초 영상 */}
      <Composition
        id="StarlineSystem"
        component={StarlineSystem}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
