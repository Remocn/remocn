"use client";

import { Sequence } from "remotion";
import { FadeThrough } from "@/registry/remocn/fade-through";

export const FadeThroughExampleScene = () => (
  <>
    <Sequence durationInFrames={40}>
      <FadeThrough fromText="Calm transitions." toText="Fade through content." />
    </Sequence>
    <Sequence from={40} durationInFrames={40}>
      <FadeThrough
        fromText="Fade through content."
        toText="Focus shifts smoothly."
      />
    </Sequence>
  </>
);

export const fadeThroughExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { FadeThrough } from "@/components/remocn/fade-through";

const FadeThroughScene = () => (
  <>
    <Sequence durationInFrames={40}>
      <FadeThrough fromText="Calm transitions." toText="Fade through content." />
    </Sequence>
    <Sequence from={40} durationInFrames={40}>
      <FadeThrough fromText="Fade through content." toText="Focus shifts smoothly." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="FadeThrough"
    component={FadeThroughScene}
    durationInFrames={80}
    fps={30}
    width={1280}
    height={720}
  />
);`;
