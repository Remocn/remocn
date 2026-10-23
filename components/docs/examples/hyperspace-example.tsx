"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { hyperspace } from "@/registry/remocn/hyperspace";

interface HyperspaceExampleProps {
  stars?: number;
  streakColor?: string;
  accentColor?: string;
  accentRatio?: number;
  flash?: boolean;
  flashColor?: string;
}

export function HyperspaceExampleScene({
  stars,
  streakColor,
  accentColor,
  accentRatio,
  flash,
  flashColor,
}: HyperspaceExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 56 })}
        presentation={hyperspace({
          stars,
          streakColor,
          accentColor,
          accentRatio,
          flash,
          flashColor,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={90}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const hyperspaceExampleCode = (
  values: Record<string, unknown>,
): string => {
  const stars = (values.stars as number) ?? 260;
  const streakColor = (values.streakColor as string) ?? "#FFFFFF";
  const accentColor = (values.accentColor as string) ?? "#E5322D";
  const accentRatio = (values.accentRatio as number) ?? 0.14;
  const flash = (values.flash as boolean) ?? true;
  const flashColor = (values.flashColor as string) ?? "#FFFFFF";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { hyperspace } from "@/components/remocn/hyperspace";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 56 })}
      presentation={hyperspace({
        stars: ${stars},
        streakColor: "${streakColor}",
        accentColor: "${accentColor}",
        accentRatio: ${accentRatio},
        flash: ${flash},
        flashColor: "${flashColor}",
      })}
    />
    <TransitionSeries.Sequence durationInFrames={90}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
