"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { focusPull } from "@/registry/remocn/focus-pull";

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

interface FocusPullExampleProps {
  blur?: number;
}

export function FocusPullExampleScene({ blur }: FocusPullExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(80)}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(46) })}
        presentation={focusPull({ blur })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(80)}>
        <Scene label="Focus Pull" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const focusPullExampleCode = (
  values: Record<string, unknown>,
): string => {
  const blur = (values.blur as number) ?? 16;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { focusPull } from "@/components/remocn/focus-pull";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={160}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 92 })}
      presentation={focusPull({ blur: ${blur} })}
    />
    <TransitionSeries.Sequence durationInFrames={160}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
