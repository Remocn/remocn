"use client";

import { Sequence } from "remotion";
import { SharedAxisY } from "@/registry/remocn/shared-axis-y";

export const SharedAxisYExampleScene = () => (
  <>
    <Sequence durationInFrames={90}>
      <SharedAxisY fromText="Layered navigation." toText="Hierarchy made clear." />
    </Sequence>
    <Sequence from={90} durationInFrames={90}>
      <SharedAxisY
        fromText="Hierarchy made clear."
        toText="Depth with restraint."
      />
    </Sequence>
  </>
);

export const sharedAxisYExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { SharedAxisY } from "@/components/remocn/shared-axis-y";

const SharedAxisYScene = () => (
  <>
    <Sequence durationInFrames={90}>
      <SharedAxisY fromText="Layered navigation." toText="Hierarchy made clear." />
    </Sequence>
    <Sequence from={90} durationInFrames={90}>
      <SharedAxisY fromText="Hierarchy made clear." toText="Depth with restraint." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="SharedAxisY"
    component={SharedAxisYScene}
    durationInFrames={180}
    fps={30}
    width={1280}
    height={720}
  />
);`;
