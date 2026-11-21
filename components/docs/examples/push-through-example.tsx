"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { pushThrough } from "@/registry/remocn/push-through";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ label, background }: { label: string; background: string }) {
  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 96,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#f2f2f2",
        }}
      >
        {label}
      </span>
    </AbsoluteFill>
  );
}

interface PushThroughExampleProps {
  zoom?: number;
  blur?: number;
}

export function PushThroughExampleScene({
  zoom,
  blur,
}: PushThroughExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(76)}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(40) })}
        presentation={pushThrough({ zoom, blur })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(76)}>
        <Scene label="Push Through" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const pushThroughExampleCode = (
  values: Record<string, unknown>,
): string => {
  const zoom = (values.zoom as number) ?? 2.4;
  const blur = (values.blur as number) ?? 14;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushThrough } from "@/components/remocn/push-through";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={152}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 80 })}
      presentation={pushThrough({ zoom: ${zoom}, blur: ${blur} })}
    />
    <TransitionSeries.Sequence durationInFrames={152}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
