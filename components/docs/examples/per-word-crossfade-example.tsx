"use client";

import { Sequence } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { PerWordCrossfade } from "@/registry/remocn/per-word-crossfade";

export const PerWordCrossfadeExampleScene = () => {
  const toFrames = useCompositionFrames();
  return (
    <>
      <Sequence durationInFrames={toFrames(50)}>
        <PerWordCrossfade
          fromText="Beautifully simple."
          toText="Designed for focus."
        />
      </Sequence>
      <Sequence from={toFrames(50)} durationInFrames={toFrames(50)}>
        <PerWordCrossfade
          fromText="Designed for focus."
          toText="Built for people."
        />
      </Sequence>
    </>
  );
};

export const perWordCrossfadeExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { PerWordCrossfade } from "@/components/remocn/per-word-crossfade";

const PerWordCrossfadeScene = () => (
  <>
    <Sequence durationInFrames={100}>
      <PerWordCrossfade fromText="Beautifully simple." toText="Designed for focus." />
    </Sequence>
    <Sequence from={100} durationInFrames={100}>
      <PerWordCrossfade fromText="Designed for focus." toText="Built for people." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="PerWordCrossfade"
    component={PerWordCrossfadeScene}
    durationInFrames={200}
    fps={60}
    width={1280}
    height={720}
  />
);`;
