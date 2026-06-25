"use client";

import { Sequence } from "remotion";
import { PerWordCrossfade } from "@/registry/remocn/per-word-crossfade";

export const PerWordCrossfadeExampleScene = () => (
  <>
    <Sequence durationInFrames={50}>
      <PerWordCrossfade
        fromText="Beautifully simple."
        toText="Designed for focus."
      />
    </Sequence>
    <Sequence from={50} durationInFrames={50}>
      <PerWordCrossfade
        fromText="Designed for focus."
        toText="Built for people."
      />
    </Sequence>
  </>
);

export const perWordCrossfadeExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { PerWordCrossfade } from "@/components/remocn/per-word-crossfade";

const PerWordCrossfadeScene = () => (
  <>
    <Sequence durationInFrames={50}>
      <PerWordCrossfade fromText="Beautifully simple." toText="Designed for focus." />
    </Sequence>
    <Sequence from={50} durationInFrames={50}>
      <PerWordCrossfade fromText="Designed for focus." toText="Built for people." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="PerWordCrossfade"
    component={PerWordCrossfadeScene}
    durationInFrames={100}
    fps={30}
    width={1280}
    height={720}
  />
);`;
