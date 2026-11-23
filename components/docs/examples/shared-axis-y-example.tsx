"use client";

import { Sequence } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { SharedAxisY } from "@/registry/remocn/shared-axis-y";

export const SharedAxisYExampleScene = () => {
  const toFrames = useCompositionFrames();
  return (
    <>
      <Sequence durationInFrames={toFrames(40)}>
        <SharedAxisY
          fromText="Layered navigation."
          toText="Hierarchy made clear."
        />
      </Sequence>
      <Sequence from={toFrames(40)} durationInFrames={toFrames(40)}>
        <SharedAxisY
          fromText="Hierarchy made clear."
          toText="Depth with restraint."
        />
      </Sequence>
    </>
  );
};

export const sharedAxisYExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { SharedAxisY } from "@/components/remocn/shared-axis-y";

const SharedAxisYScene = () => (
  <>
    <Sequence durationInFrames={80}>
      <SharedAxisY fromText="Layered navigation." toText="Hierarchy made clear." />
    </Sequence>
    <Sequence from={80} durationInFrames={80}>
      <SharedAxisY fromText="Hierarchy made clear." toText="Depth with restraint." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="SharedAxisY"
    component={SharedAxisYScene}
    durationInFrames={160}
    fps={60}
    width={1280}
    height={720}
  />
);`;
