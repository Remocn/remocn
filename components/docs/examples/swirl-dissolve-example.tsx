"use client";

import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { swirlDissolve } from "@/registry/remocn/swirl-dissolve";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ label, background }: { label: string; background?: string }) {
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

interface SwirlDissolveExampleProps {
  bandCount?: number;
  softness?: number;
  colorBack?: string;
  speed?: number;
}

export function SwirlDissolveExampleScene({
  bandCount,
  softness,
  colorBack,
  speed,
}: SwirlDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 104 })}
        presentation={swirlDissolve({ bandCount, softness, colorBack, speed })}
      />
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene label="Scene B" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const swirlDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const bandCount = (values.bandCount as number) ?? 10;
  const softness = (values.softness as number) ?? 0.35;
  const colorBack = (values.colorBack as string) ?? "#141318";
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { swirlDissolve } from "@/components/remocn/swirl-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 104 })}
      presentation={swirlDissolve({ bandCount: ${bandCount}, softness: ${softness}, colorBack: "${colorBack}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
