"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasScenePoster,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
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
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(26) })}
        presentation={venetianBlinds({ slats, stagger, direction, shadeColor })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
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
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 52 })}
      presentation={venetianBlinds({ slats: ${slats}, stagger: ${stagger}, direction: "${direction}", shadeColor: "${shadeColor}" })}
    />
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
