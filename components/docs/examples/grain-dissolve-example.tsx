"use client";

import { AbsoluteFill, Sequence } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import {
  grainDissolve,
  type GrainDissolveProps,
} from "@/registry/remocn/grain-dissolve";
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

interface GrainDissolveExampleProps {
  shape?: GrainDissolveProps["shape"];
  noise?: number;
  zoom?: number;
  colorBack?: string;
  speed?: number;
}

export function GrainDissolveExampleScene({
  shape,
  noise,
  zoom,
  colorBack,
  speed,
}: GrainDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={96}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 76 })}
        presentation={grainDissolve({ shape, noise, zoom, colorBack, speed })}
      />
      <TransitionSeries.Sequence durationInFrames={96}>
        <AbsoluteFill style={{ background: "#141318" }}>
          <Sequence from={54}>
            <SoftBlurIn text="Grain Dissolve" fontSize={96} color="#f2f2f2" />
          </Sequence>
        </AbsoluteFill>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const grainDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const shape = (values.shape as string) ?? "blob";
  const noise = (values.noise as number) ?? 0.3;
  const zoom = (values.zoom as number) ?? 2;
  const colorBack = (values.colorBack as string) ?? "#141318";
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { grainDissolve } from "@/components/remocn/grain-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={96}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 76 })}
      presentation={grainDissolve({ shape: "${shape}", noise: ${noise}, zoom: ${zoom}, colorBack: "${colorBack}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={96}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
