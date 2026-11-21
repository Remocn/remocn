"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import { emberBurn } from "@/registry/remocn/ember-burn";

interface EmberBurnExampleProps {
  patches?: number;
  edgeSoftness?: number;
  contentBias?: number;
  heat?: number;
  glowColor?: string;
  emberAmount?: number;
}

export function EmberBurnExampleScene({
  patches,
  edgeSoftness,
  contentBias,
  heat,
  glowColor,
  emberAmount,
}: EmberBurnExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(40) })}
        presentation={emberBurn({
          patches,
          edgeSoftness,
          contentBias,
          heat,
          glowColor,
          emberAmount,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const emberBurnExampleCode = (
  values: Record<string, unknown>,
): string => {
  const patches = (values.patches as number) ?? 5;
  const edgeSoftness = (values.edgeSoftness as number) ?? 0.07;
  const contentBias = (values.contentBias as number) ?? 0.6;
  const heat = (values.heat as number) ?? 0.5;
  const glowColor = (values.glowColor as string) ?? "#ff7a2f";
  const emberAmount = (values.emberAmount as number) ?? 0.5;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { emberBurn } from "@/components/remocn/ember-burn";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 80 })}
      presentation={emberBurn({ patches: ${patches}, edgeSoftness: ${edgeSoftness}, contentBias: ${contentBias}, heat: ${heat}, glowColor: "${glowColor}", emberAmount: ${emberAmount} })}
    />
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
