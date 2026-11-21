"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { type GridWaveDirection, gridWave } from "@/registry/remocn/grid-wave";

interface GridWaveExampleProps {
  tileSize?: number;
  waveWidth?: number;
  lift?: number;
  gap?: number;
  tint?: string;
  direction?: string;
}

export function GridWaveExampleScene({
  tileSize,
  waveWidth,
  lift,
  gap,
  tint,
  direction,
}: GridWaveExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(36) })}
        presentation={gridWave({
          tileSize,
          waveWidth,
          lift,
          gap,
          tint,
          direction: direction as GridWaveDirection | undefined,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const gridWaveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const tileSize = (values.tileSize as number) ?? 90;
  const waveWidth = (values.waveWidth as number) ?? 0.16;
  const lift = (values.lift as number) ?? 2;
  const gap = (values.gap as number) ?? 0.12;
  const tint = (values.tint as string) ?? "#8fb4ff";
  const direction = (values.direction as string) ?? "ripple";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { gridWave } from "@/components/remocn/grid-wave";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 72 })}
      presentation={gridWave({ tileSize: ${tileSize}, waveWidth: ${waveWidth}, lift: ${lift}, gap: ${gap}, tint: "${tint}", direction: "${direction}" })}
    />
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
