"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "@/components/remocn/shader-grain-gradient";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#3a3a52", "#4a4a68", "#8f88ae"];

export type GrainDissolveProps = {
  colors?: string[];
  colorBack?: string;
  shape?: NonNullable<ShaderGrainGradientProps["shape"]>;
  noise?: number;
  zoom?: number;
  speed?: number;
};

const GrainDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<GrainDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colors = DEFAULT_COLORS,
    colorBack = "#141318",
    shape = "blob",
    noise = 0.3,
    zoom = 2,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.14, 0.34], [1, 0], clampOpts),
      filter: `blur(${interpolate(p, [0.06, 0.34], [0, 10], clampOpts)}px)`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  const fieldOpacity = interpolate(p, [0, 0.26], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const intensity = interpolate(p, [0.08, 0.92], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const softness = interpolate(p, [0.08, 0.92], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const fieldScale = zoom * interpolate(p, [0, 1], [0.9, 1.15], clampOpts);

  const childStyle: React.CSSProperties = {
    opacity: interpolate(p, [0.7, 0.86], [0, 1], clampOpts),
    transform: `scale(${interpolate(p, [0.7, 1], [1.05, 1], {
      ...clampOpts,
      easing: Easing.out(Easing.cubic),
    })})`,
    filter: `blur(${interpolate(p, [0.7, 0.92], [10, 0], clampOpts)}px)`,
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fieldOpacity, pointerEvents: "none" }}>
        <ShaderGrainGradient
          speed={speed}
          colors={colors}
          colorBack={colorBack}
          shape={shape}
          noise={noise}
          intensity={intensity}
          softness={softness}
          scale={fieldScale}
        />
      </AbsoluteFill>
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function grainDissolve(
  props: GrainDissolveProps = {},
): TransitionPresentation<GrainDissolveProps> {
  return {
    component: GrainDissolvePresentation,
    props,
  };
}
