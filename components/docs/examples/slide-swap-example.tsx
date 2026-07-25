"use client";

import { AbsoluteFill } from "remotion";
import { type SlideAxis, SlideSwapScenes } from "@/registry/remocn/slide-swap";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ title, note }: { title: string; note: string }) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 88,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#f2f2f2",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 26,
          fontWeight: 400,
          color: "rgba(242,242,242,0.5)",
        }}
      >
        {note}
      </span>
    </AbsoluteFill>
  );
}

interface SlideSwapExampleProps {
  axis?: string;
  inDistance?: number;
  outDistance?: number;
  slideFrames?: number;
}

export function SlideSwapExampleScene({
  axis = "x",
  inDistance = 0.28,
  outDistance = 0.1,
  slideFrames = 30,
}: SlideSwapExampleProps) {
  return (
    <SlideSwapScenes
      loop
      axis={axis as SlideAxis}
      config={{ inDistance, outDistance, slideFrames }}
      scenes={[
        {
          name: "a",
          content: (
            <Scene title="Shove" note="the old scene leaves under power" />
          ),
        },
        {
          name: "b",
          content: (
            <Scene title="Spring" note="the new one brakes into place" />
          ),
        },
        {
          name: "c",
          content: (
            <Scene
              title="No overlap"
              note="one canvas, two scenes, never both"
            />
          ),
        },
      ]}
    />
  );
}

export const slideSwapExampleCode = (
  values: Record<string, unknown>,
): string => {
  const axis = (values.axis as string) ?? "x";
  const inDistance = (values.inDistance as number) ?? 0.28;
  const outDistance = (values.outDistance as number) ?? 0.1;
  const slideFrames = (values.slideFrames as number) ?? 30;
  return `import { SlideSwapScenes } from "@/components/remocn/slide-swap";

export const MyVideo = () => (
  <SlideSwapScenes
    axis="${axis}"
    config={{
      inDistance: ${inDistance},
      outDistance: ${outDistance},
      slideFrames: ${slideFrames},
    }}
    scenes={[
      { name: "a", durationInFrames: 70, content: <SceneA /> },
      { name: "b", durationInFrames: 70, content: <SceneB /> },
      { name: "c", durationInFrames: 70, content: <SceneC /> },
    ]}
  />
);`;
};
