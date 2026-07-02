"use client";

import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { ShaderWarp } from "@/components/remocn/shader-warp";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#141318", "#3a3a5c", "#1f1d29", "#8f88ae"];

export type WarpDissolveProps = {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  softness?: number;
  speed?: number;
};

const WarpDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<WarpDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colors = DEFAULT_COLORS,
    distortion = 0.8,
    swirl = 0.6,
    softness = 1,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    const meltStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.2, 0.38], [1, 0], clampOpts),
      transform: `scale(${interpolate(p, [0, 0.38], [1, 1.16], {
        ...clampOpts,
        easing: Easing.in(Easing.cubic),
      })})`,
      filter: `blur(${interpolate(p, [0.04, 0.38], [0, 18], clampOpts)}px)`,
    };
    return <AbsoluteFill style={meltStyle}>{children}</AbsoluteFill>;
  }

  const fieldOpacity = interpolate(p, [0, 0.32], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const fieldDistortion = interpolate(
    p,
    [0, 0.5, 1],
    [distortion * 0.3, distortion, distortion * 0.4],
    clampOpts,
  );

  const childStyle: React.CSSProperties = {
    opacity: interpolate(p, [0.66, 0.82], [0, 1], clampOpts),
    transform: `scale(${interpolate(p, [0.66, 1], [1.18, 1], {
      ...clampOpts,
      easing: Easing.out(Easing.cubic),
    })})`,
    filter: `blur(${interpolate(p, [0.66, 0.92], [16, 0], clampOpts)}px)`,
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fieldOpacity, pointerEvents: "none" }}>
        <ShaderWarp
          speed={speed}
          colors={colors}
          distortion={fieldDistortion}
          swirl={swirl}
          softness={softness}
        />
      </AbsoluteFill>
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function warpDissolve(
  props: WarpDissolveProps = {},
): TransitionPresentation<WarpDissolveProps> {
  return {
    component: WarpDissolvePresentation,
    props,
  };
}
