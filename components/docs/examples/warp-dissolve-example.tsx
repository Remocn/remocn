"use client";

import { AbsoluteFill, Sequence } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { warpDissolve } from "@/registry/remocn/warp-dissolve";
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

interface WarpDissolveExampleProps {
  distortion?: number;
  swirl?: number;
  softness?: number;
  speed?: number;
}

export function WarpDissolveExampleScene({
  distortion,
  swirl,
  softness,
  speed,
}: WarpDissolveExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={96}>
        <Scene label="Scene A" background="#141318" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 76 })}
        presentation={warpDissolve({ distortion, swirl, softness, speed })}
      />
      <TransitionSeries.Sequence durationInFrames={96}>
        <AbsoluteFill style={{ background: "#141318" }}>
          <Sequence from={50}>
            <SoftBlurIn text="Warp Dissolve" fontSize={96} color="#f2f2f2" />
          </Sequence>
        </AbsoluteFill>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const warpDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const distortion = (values.distortion as number) ?? 0.8;
  const swirl = (values.swirl as number) ?? 0.6;
  const softness = (values.softness as number) ?? 1;
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { warpDissolve } from "@/components/remocn/warp-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={96}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 76 })}
      presentation={warpDissolve({ distortion: ${distortion}, swirl: ${swirl}, softness: ${softness}, speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={96}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
