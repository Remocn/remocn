"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { ditherDissolve } from "@/registry/remocn/dither-dissolve";

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

interface DitherDissolveExampleProps {
  shape?: "simplex" | "warp" | "dots" | "wave" | "ripple" | "swirl" | "sphere";
  colorBack?: string;
  colorFront?: string;
  speed?: number;
}

export function DitherDissolveExampleScene({
  shape,
  colorBack,
  colorFront,
  speed,
}: DitherDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 40 })}
        presentation={ditherDissolve({ shape, colorBack, colorFront, speed })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <Scene label="Scene B" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const ditherDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const shape = (values.shape as string) ?? "simplex";
  const colorBack = (values.colorBack as string) ?? "#141318";
  const colorFront = (values.colorFront as string) ?? "#8f88ae";
  const speed = (values.speed as number) ?? 1.5;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { ditherDissolve } from "@/components/remocn/dither-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 40 })}
      presentation={ditherDissolve({ shape: "${shape}", colorBack: "${colorBack}", colorFront: "${colorFront}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
