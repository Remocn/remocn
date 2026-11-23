"use client";

import { Sequence } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { FadeThrough } from "@/registry/remocn/fade-through";

export const FadeThroughExampleScene = () => {
  const toFrames = useCompositionFrames();
  return (
    <>
      <Sequence durationInFrames={toFrames(40)}>
        <FadeThrough
          fromText="Calm transitions."
          toText="Fade through content."
        />
      </Sequence>
      <Sequence from={toFrames(40)} durationInFrames={toFrames(40)}>
        <FadeThrough
          fromText="Fade through content."
          toText="Focus shifts smoothly."
        />
      </Sequence>
    </>
  );
};

export const fadeThroughExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { FadeThrough } from "@/components/remocn/fade-through";

const FadeThroughScene = () => (
  <>
    <Sequence durationInFrames={80}>
      <FadeThrough fromText="Calm transitions." toText="Fade through content." />
    </Sequence>
    <Sequence from={80} durationInFrames={80}>
      <FadeThrough fromText="Fade through content." toText="Focus shifts smoothly." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="FadeThrough"
    component={FadeThroughScene}
    durationInFrames={160}
    fps={60}
    width={1280}
    height={720}
  />
);`;
