"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasScenePoster,
} from "@/components/docs/examples/canvas-scenes";
import {
  type VenetianBlindsProps,
  venetianBlinds,
} from "@/registry/remocn/venetian-blinds";

interface VenetianBlindsExampleProps {
  slats?: number;
  stagger?: number;
  direction?: VenetianBlindsProps["direction"];
  shadeColor?: string;
}

export function VenetianBlindsExampleScene({
  slats,
  stagger,
  direction,
  shadeColor,
}: VenetianBlindsExampleProps) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 26 })}
        presentation={venetianBlinds({ slats, stagger, direction, shadeColor })}
      />
      <TransitionSeries.Sequence durationInFrames={70}>
        <CanvasScenePoster />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const venetianBlindsExampleCode = (
  values: Record<string, unknown>,
): string => {
  const slats = (values.slats as number) ?? 12;
  const stagger = (values.stagger as number) ?? 0.55;
  const direction = (values.direction as string) ?? "top-down";
  const shadeColor = (values.shadeColor as string) ?? "#000000";
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { venetianBlinds } from "@/components/remocn/venetian-blinds";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 26 })}
      presentation={venetianBlinds({ slats: ${slats}, stagger: ${stagger}, direction: "${direction}", shadeColor: "${shadeColor}" })}
    />
    <TransitionSeries.Sequence durationInFrames={70}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
