"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasScenePoster,
} from "@/components/docs/examples/canvas-scenes";
import { paperTear } from "@/registry/remocn/paper-tear";

interface PaperTearExampleProps {
  impact?: number;
  roughness?: number;
  seed?: number;
  edgeColor?: string;
}

export function PaperTearExampleScene({
  impact,
  roughness,
  seed,
  edgeColor,
}: PaperTearExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 36 })}
        presentation={paperTear({ impact, roughness, seed, edgeColor })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasScenePoster />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const paperTearExampleCode = (
  values: Record<string, unknown>,
): string => {
  const impact = (values.impact as number) ?? 1;
  const roughness = (values.roughness as number) ?? 0.5;
  const seed = (values.seed as number) ?? 7;
  const edgeColor = (values.edgeColor as string) ?? "#FFFFFF";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { paperTear } from "@/components/remocn/paper-tear";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 36 })}
      presentation={paperTear({ impact: ${impact}, roughness: ${roughness}, seed: ${seed}, edgeColor: "${edgeColor}" })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
