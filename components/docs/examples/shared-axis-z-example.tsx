"use client";

import { Sequence } from "remotion";
import { SharedAxisZ } from "@/registry/remocn/shared-axis-z";

export const SharedAxisZExampleScene = () => (
  <>
    <Sequence durationInFrames={40}>
      <SharedAxisZ
        fromText="Zooming between states."
        toText="Elevate and settle."
      />
    </Sequence>
    <Sequence from={40} durationInFrames={40}>
      <SharedAxisZ
        fromText="Elevate and settle."
        toText="Scale with purpose."
      />
    </Sequence>
  </>
);

export const sharedAxisZExampleCode =
  (): string => `import { Composition, Sequence } from "remotion";
import { SharedAxisZ } from "@/components/remocn/shared-axis-z";

const SharedAxisZScene = () => (
  <>
    <Sequence durationInFrames={40}>
      <SharedAxisZ fromText="Zooming between states." toText="Elevate and settle." />
    </Sequence>
    <Sequence from={40} durationInFrames={40}>
      <SharedAxisZ fromText="Elevate and settle." toText="Scale with purpose." />
    </Sequence>
  </>
);

export const RemotionRoot = () => (
  <Composition
    id="SharedAxisZ"
    component={SharedAxisZScene}
    durationInFrames={80}
    fps={30}
    width={1280}
    height={720}
  />
);`;
