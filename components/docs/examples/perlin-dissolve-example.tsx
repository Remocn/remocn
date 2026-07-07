"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Sequence } from "remotion";
import { perlinDissolve } from "@/registry/remocn/perlin-dissolve";
import { SoftBlurIn } from "@/registry/remocn/soft-blur-in";

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

interface PerlinDissolveExampleProps {
  colorFront?: string;
  colorBack?: string;
  softness?: number;
  speed?: number;
}

export function PerlinDissolveExampleScene({
  colorFront,
  colorBack,
  softness,
  speed,
}: PerlinDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={110}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 104 })}
        presentation={perlinDissolve({
          colorFront,
          colorBack,
          softness,
          speed,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={110}>
        <Sequence from={52}>
          <SoftBlurIn text="Perlin Dissolve" fontSize={96} color="#f2f2f2" />
        </Sequence>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const perlinDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const colorFront = (values.colorFront as string) ?? "#8f88ae";
  const colorBack = (values.colorBack as string) ?? "#141318";
  const softness = (values.softness as number) ?? 0.1;
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { perlinDissolve } from "@/components/remocn/perlin-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 104 })}
      presentation={perlinDissolve({ colorFront: "${colorFront}", colorBack: "${colorBack}", softness: ${softness}, speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={110}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
