"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { smokeDissolve } from "@/registry/remocn/smoke-dissolve";

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

interface SmokeDissolveExampleProps {
  ringColor?: string;
  colorBack?: string;
  speed?: number;
}

export function SmokeDissolveExampleScene({
  ringColor,
  colorBack,
  speed,
}: SmokeDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 104 })}
        presentation={smokeDissolve({
          colors: ringColor ? [ringColor] : undefined,
          colorBack,
          speed,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene label="Scene B" background="transparent" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const smokeDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const ringColor = (values.ringColor as string) ?? "#8f88ae";
  const colorBack = (values.colorBack as string) ?? "#141318";
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { smokeDissolve } from "@/components/remocn/smoke-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 104 })}
      presentation={smokeDissolve({ colors: ["${ringColor}"], colorBack: "${colorBack}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
