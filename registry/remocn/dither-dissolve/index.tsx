"use client";

import type React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { ShaderDithering } from "@/components/remocn/shader-dithering";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const coverEnvelope = (p: number) =>
  interpolate(p, [0, 0.3, 0.65, 1], [0, 1, 1, 0], clampOpts);

const coverChildOpacity = (p: number, entering: boolean) =>
  entering
    ? interpolate(p, [0.58, 0.66], [0, 1], clampOpts)
    : interpolate(p, [0.28, 0.36], [1, 0], clampOpts);

type DitherShape = NonNullable<
  React.ComponentProps<typeof ShaderDithering>["shape"]
>;

export type DitherDissolveProps = {
  colorBack?: string;
  colorFront?: string;
  shape?: DitherShape;
  speed?: number;
};

const DitherDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<DitherDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colorBack = "#141318",
    colorFront = "#8f88ae",
    shape = "simplex",
    speed = 1.5,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;
  const size = interpolate(p, [0, 1], [1.6, 2.8], clampOpts);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: coverChildOpacity(p, entering) }}>
        {children}
      </AbsoluteFill>
      {entering ? (
        <AbsoluteFill
          style={{ opacity: coverEnvelope(p), pointerEvents: "none" }}
        >
          <ShaderDithering
            speed={speed}
            colorBack={colorBack}
            colorFront={colorFront}
            shape={shape}
            size={size}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export function ditherDissolve(
  props: DitherDissolveProps = {},
): TransitionPresentation<DitherDissolveProps> {
  return {
    component: DitherDissolvePresentation,
    props,
  };
}
