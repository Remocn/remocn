"use client";

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useCompositionFrames, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  LENS_ZOOM_DURATION_IN_FRAMES,
  lensZoom,
} from "@/registry/remocn/lens-zoom";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({
  label,
  background,
  squeezeAt,
}: {
  label: string;
  background: string;
  squeezeAt?: number;
}) {
  const glide = useGlide();
  const frame = useSceneFrame();
  const scale =
    squeezeAt === undefined
      ? 1
      : interpolate(frame, [squeezeAt, squeezeAt + 7], [1, 0.87], {
          easing: Easing.bezier(0.32, 0, 0.24, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 96,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#f2f2f2",
          transform: `scale(${scale})${glide(
            squeezeAt !== undefined &&
              frame > squeezeAt &&
              frame < squeezeAt + 7,
          )}`,
        }}
      >
        {label}
      </span>
    </AbsoluteFill>
  );
}

interface LensZoomExampleProps {
  lensSteps?: number;
  blurSamples?: number;
  shakeAmount?: number;
  shakeTranslatePx?: number;
}

export function LensZoomExampleScene({
  lensSteps,
  blurSamples,
  shakeAmount,
  shakeTranslatePx,
}: LensZoomExampleProps) {
  const toFrames = useCompositionFrames();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
        <Scene label="Scene A" background="#141318" squeezeAt={35} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({
          durationInFrames: toFrames(LENS_ZOOM_DURATION_IN_FRAMES),
        })}
        presentation={lensZoom({
          lensSteps,
          blurSamples,
          shakeAmount,
          shakeTranslatePx,
        })}
      />
      <TransitionSeries.Sequence durationInFrames={toFrames(70)}>
        <Scene label="Lens Zoom" background="#1a1922" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}

export const lensZoomExampleCode = (
  values: Record<string, unknown>,
): string => {
  const lensSteps = (values.lensSteps as number) ?? 9;
  const blurSamples = (values.blurSamples as number) ?? 7;
  const shakeAmount = (values.shakeAmount as number) ?? 50;
  return `import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { lensZoom, LENS_ZOOM_DURATION_IN_FRAMES } from "@/components/remocn/lens-zoom";

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: LENS_ZOOM_DURATION_IN_FRAMES * 2 })}
      presentation={lensZoom({ lensSteps: ${lensSteps}, blurSamples: ${blurSamples}, shakeAmount: ${shakeAmount} })}
    />
    <TransitionSeries.Sequence durationInFrames={140}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);`;
};
