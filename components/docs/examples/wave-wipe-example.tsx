"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Sequence } from "remotion";
import { SoftBlurIn } from "@/registry/remocn/soft-blur-in";
import { waveWipe } from "@/registry/remocn/wave-wipe";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({ label }: { label: string }) {
  return (
    <AbsoluteFill
      style={{
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

interface WaveWipeExampleProps {
  intensity?: number;
  softness?: number;
  noise?: number;
  colorBack?: string;
  speed?: number;
}

export function WaveWipeExampleScene({
  intensity,
  softness,
  noise,
  colorBack,
  speed,
}: WaveWipeExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={88}>
        <Scene label="Scene A" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 60 })}
        presentation={waveWipe({
          intensity,
          softness,
          noise,
          colorBack,
          speed,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={88}>
        <AbsoluteFill>
          <Sequence from={48}>
            <SoftBlurIn text="Wave Wipe" fontSize={96} color="#f2f2f2" />
          </Sequence>
        </AbsoluteFill>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const waveWipeExampleCode = (
  values: Record<string, unknown>,
): string => {
  const intensity = (values.intensity as number) ?? 0.2;
  const softness = (values.softness as number) ?? 0.7;
  const noise = (values.noise as number) ?? 0.4;
  const colorBack = (values.colorBack as string) ?? "#141318";
  const speed = (values.speed as number) ?? 1;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { waveWipe } from "@/components/remocn/wave-wipe";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={88}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 60 })}
      presentation={waveWipe({ intensity: ${intensity}, softness: ${softness}, noise: ${noise}, colorBack: "${colorBack}", speed: ${speed} })}
    />
    <TransitionSeries.Sequence durationInFrames={88}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
