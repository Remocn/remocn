"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ShaderSmokeRing } from "@/components/remocn/shader-smoke-ring";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#8f88ae"];

export type SmokeDissolveProps = {
  colorBack?: string;
  colors?: string[];
  speed?: number;
};

const SmokeDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<SmokeDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colorBack = "#141318",
    colors = DEFAULT_COLORS,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  const radius = interpolate(p, [0, 1], [0, 1], clampOpts);
  const scale = interpolate(p, [0, 1], [1, 2], clampOpts);
  const thickness = interpolate(p, [0, 1], [1, 1.5], clampOpts);

  const childStyle: React.CSSProperties = entering
    ? {
        opacity: interpolate(p, [0.55, 0.68], [0, 1], clampOpts),
        transform: `scale(${interpolate(p, [0.55, 1], [0.3, 1], {
          ...clampOpts,
          easing: Easing.out(Easing.cubic),
        })})`,
        filter: `blur(${interpolate(p, [0.55, 0.75], [10, 0], clampOpts)}px)`,
      }
    : { opacity: interpolate(p, [0.06, 0.13], [1, 0], clampOpts) };

  return (
    <AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <ShaderSmokeRing
            speed={speed}
            colorBack={colorBack}
            colors={colors}
            radius={radius}
            scale={scale}
            thickness={thickness}
          />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function smokeDissolve(
  props: SmokeDissolveProps = {},
): TransitionPresentation<SmokeDissolveProps> {
  return {
    component: SmokeDissolvePresentation,
    props,
  };
}
