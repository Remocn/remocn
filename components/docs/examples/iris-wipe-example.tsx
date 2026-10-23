"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneB,
  CanvasScenePoster,
} from "@/components/docs/examples/canvas-scenes";
import { irisWipe } from "@/registry/remocn/iris-wipe";

interface IrisWipeExampleProps {
  color?: string;
  centerX?: number;
  centerY?: number;
  holdRadius?: number;
}

export function IrisWipeExampleScene({
  color,
  centerX,
  centerY,
  holdRadius,
}: IrisWipeExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasScenePoster />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 36 })}
        presentation={irisWipe({ color, centerX, centerY, holdRadius })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const irisWipeExampleCode = (
  values: Record<string, unknown>,
): string => {
  const color = (values.color as string) ?? "#000000";
  const centerX = (values.centerX as number) ?? 0.5;
  const centerY = (values.centerY as number) ?? 0.5;
  const holdRadius = (values.holdRadius as number) ?? 12;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { irisWipe } from "@/components/remocn/iris-wipe";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 36 })}
      presentation={irisWipe({ color: "${color}", centerX: ${centerX}, centerY: ${centerY}, holdRadius: ${holdRadius} })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
