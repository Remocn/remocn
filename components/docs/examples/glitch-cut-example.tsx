"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { glitchCut } from "@/registry/remocn/glitch-cut";

interface GlitchCutExampleProps {
  intensity?: number;
  slices?: number;
  rgbSplit?: number;
  blockNoise?: number;
}

export function GlitchCutExampleScene({
  intensity,
  slices,
  rgbSplit,
  blockNoise,
}: GlitchCutExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(45)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(12) })}
        presentation={glitchCut({ intensity, slices, rgbSplit, blockNoise })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(45)}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const glitchCutExampleCode = (
  values: Record<string, unknown>,
): string => {
  const intensity = (values.intensity as number) ?? 1;
  const slices = (values.slices as number) ?? 24;
  const rgbSplit = (values.rgbSplit as number) ?? 1;
  const blockNoise = (values.blockNoise as number) ?? 0.6;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { glitchCut } from "@/components/remocn/glitch-cut";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 24 })}
      presentation={glitchCut({ intensity: ${intensity}, slices: ${slices}, rgbSplit: ${rgbSplit}, blockNoise: ${blockNoise} })}
    />
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
