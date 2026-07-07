"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { type WhipPanProps, whipPan } from "@/registry/remocn/whip-pan";

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

interface WhipPanExampleProps {
  direction?: WhipPanProps["direction"];
  blur?: number;
}

export function WhipPanExampleScene({ direction, blur }: WhipPanExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 26 })}
        presentation={whipPan({ direction, blur })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Whip Pan" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const whipPanExampleCode = (values: Record<string, unknown>): string => {
  const direction = (values.direction as string) ?? "left";
  const blur = (values.blur as number) ?? 24;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { whipPan } from "@/components/remocn/whip-pan";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 26 })}
      presentation={whipPan({ direction: "${direction}", blur: ${blur} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
