"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ShaderGrainGradient } from "@/components/remocn/shader-grain-gradient";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#3a3a52", "#4a4a68", "#8f88ae"];

export type RippleZoomProps = {
  colors?: string[];
  colorBack?: string;
  intensity?: number;
  softness?: number;
  noise?: number;
  zoom?: number;
  speed?: number;
};

const RippleZoomPresentation: React.FC<
  TransitionPresentationComponentProps<RippleZoomProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colors = DEFAULT_COLORS,
    colorBack = "#141318",
    intensity = 0.5,
    softness = 0.5,
    noise = 0.5,
    zoom = 4,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.35, 0.55], [1, 0], {
        ...clampOpts,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      transform: `scale(${interpolate(p, [0.3, 0.62], [1, 1.6], {
        ...clampOpts,
        easing: Easing.in(Easing.cubic),
      })})`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  const fieldOpacity = interpolate(p, [0.08, 0.32], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const fieldScale = interpolate(p, [0.32, 1], [0.2, zoom], {
    ...clampOpts,
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });

  const childStyle: React.CSSProperties = {
    opacity: interpolate(p, [0.45, 0.62], [0, 1], clampOpts),
    transform: `scale(${interpolate(p, [0.42, 0.97], [0.2, 1], {
      ...clampOpts,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    })})`,
    filter: `blur(${interpolate(p, [0.42, 0.8], [8, 0], clampOpts)}px)`,
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fieldOpacity, pointerEvents: "none" }}>
        <ShaderGrainGradient
          speed={speed}
          shape="ripple"
          colors={colors}
          colorBack={colorBack}
          intensity={intensity}
          softness={softness}
          noise={noise}
          scale={fieldScale}
        />
      </AbsoluteFill>
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function rippleZoom(
  props: RippleZoomProps = {},
): TransitionPresentation<RippleZoomProps> {
  return {
    component: RippleZoomPresentation,
    props,
  };
}
