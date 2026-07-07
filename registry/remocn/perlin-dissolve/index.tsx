"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ShaderPerlinNoise } from "@/components/remocn/shader-perlin-noise";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type PerlinDissolveProps = {
  colorBack?: string;
  colorFront?: string;
  softness?: number;
  speed?: number;
};

const PerlinDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<PerlinDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colorBack = "#141318",
    colorFront = "#8f88ae",
    softness = 0.1,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  const proportion = interpolate(p, [0, 0.5], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });

  const childStyle: React.CSSProperties = entering
    ? { opacity: interpolate(p, [0.48, 0.6], [0, 1], clampOpts) }
    : { opacity: interpolate(p, [0.06, 0.13], [1, 0], clampOpts) };

  return (
    <AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <ShaderPerlinNoise
            speed={speed}
            proportion={proportion}
            colorBack={colorBack}
            colorFront={colorFront}
            softness={softness}
          />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function perlinDissolve(
  props: PerlinDissolveProps = {},
): TransitionPresentation<PerlinDissolveProps> {
  return {
    component: PerlinDissolvePresentation,
    props,
  };
}
