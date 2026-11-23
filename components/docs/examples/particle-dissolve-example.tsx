"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  CanvasSceneA,
  CanvasSceneB,
} from "@/components/docs/examples/canvas-scenes";
import { useCompositionFrames } from "@/lib/remocn/frame-rate";
import {
  type ParticleDissolveDirection,
  particleDissolve,
} from "@/registry/remocn/particle-dissolve";

interface ParticleDissolveExampleProps {
  particleSize?: number;
  scatter?: number;
  shimmer?: number;
  aberration?: number;
  direction?: string;
  stagger?: number;
}

export function ParticleDissolveExampleScene({
  particleSize,
  scatter,
  shimmer,
  aberration,
  direction,
  stagger,
}: ParticleDissolveExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: toFrames(36) })}
        presentation={particleDissolve({
          particleSize,
          scatter,
          shimmer,
          aberration,
          direction: direction as ParticleDissolveDirection | undefined,
          stagger,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(60)}>
        <CanvasSceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const particleDissolveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const particleSize = (values.particleSize as number) ?? 4;
  const scatter = (values.scatter as number) ?? 0.08;
  const shimmer = (values.shimmer as number) ?? 0.6;
  const aberration = (values.aberration as number) ?? 0.5;
  const direction = (values.direction as string) ?? "reveal";
  const stagger = (values.stagger as number) ?? 0.55;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { particleDissolve } from "@/components/remocn/particle-dissolve";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 72 })}
      presentation={particleDissolve({ particleSize: ${particleSize}, scatter: ${scatter}, shimmer: ${shimmer}, aberration: ${aberration}, direction: "${direction}", stagger: ${stagger} })}
    />
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
