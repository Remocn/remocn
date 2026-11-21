"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasScenePoster,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { pixelSort } from "@/registry/remocn/pixel-sort";

interface PixelSortExampleProps {
  columns?: number;
  seed?: number;
  streakColor?: string;
}

export function PixelSortExampleScene({
  columns,
  seed,
  streakColor,
}: PixelSortExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(30) })}
        presentation={pixelSort({ columns, seed, streakColor })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
        <CanvasScenePoster />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const pixelSortExampleCode = (
  values: Record<string, unknown>,
): string => {
  const columns = (values.columns as number) ?? 40;
  const seed = (values.seed as number) ?? 5;
  const streakColor = (values.streakColor as string) ?? "#FFFFFF";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pixelSort } from "@/components/remocn/pixel-sort";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 60 })}
      presentation={pixelSort({ columns: ${columns}, seed: ${seed}, streakColor: "${streakColor}" })}
    />
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
