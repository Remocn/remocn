"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { displacement } from "@/registry/remocn/displacement";

interface DisplacementExampleProps {
  grid?: number;
  cellAspect?: number;
  shift?: number;
  aberration?: number;
  grain?: number;
  stagger?: number;
}

export function DisplacementExampleScene({
  grid,
  cellAspect,
  shift,
  aberration,
  grain,
  stagger,
}: DisplacementExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(45)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(18) })}
        presentation={displacement({
          grid,
          cellAspect,
          shift,
          aberration,
          grain,
          stagger,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(45)}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const displacementExampleCode = (
  values: Record<string, unknown>,
): string => {
  const grid = (values.grid as number) ?? 60;
  const cellAspect = (values.cellAspect as number) ?? 1;
  const shift = (values.shift as number) ?? 1;
  const aberration = (values.aberration as number) ?? 1;
  const grain = (values.grain as number) ?? 0.5;
  const stagger = (values.stagger as number) ?? 0.45;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { displacement } from "@/components/remocn/displacement";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 36 })}
      presentation={displacement({ grid: ${grid}, cellAspect: ${cellAspect}, shift: ${shift}, aberration: ${aberration}, grain: ${grain}, stagger: ${stagger} })}
    />
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
