"use client";

import { Sequence } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { SharedAxisZ } from "@/registry/remocn/shared-axis-z";

export const SharedAxisZExampleScene = () => {
  const toFrames = useCompositionFrames();
  return (
    <>
      <Sequence durationInFrames={toFrames(40)}>
        <SharedAxisZ
          fromText="Zooming between states."
          toText="Elevate and settle."
        />
      </Sequence>
      <Sequence from={toFrames(40)} durationInFrames={toFrames(40)}>
        <SharedAxisZ
          fromText="Elevate and settle."
          toText="Scale with purpose."
        />
      </Sequence>
    </>
  );
};

export const sharedAxisZExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { SharedAxisZ } from "@/components/remocn/shared-axis-z";

const SharedAxisZScene = () => (
  <>
    <Sequence durationInFrames={80}>
      <SharedAxisZ fromText="Zooming between states." toText="Elevate and settle." />
    </Sequence>
    <Sequence from={80} durationInFrames={80}>
      <SharedAxisZ fromText="Elevate and settle." toText="Scale with purpose." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="SharedAxisZ"
    component={SharedAxisZScene}
    durationInFrames={160}
    fps={60}
    width={1280}
    height={720}
  />
);`;
