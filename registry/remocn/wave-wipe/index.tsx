"use client";

import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { ShaderGrainGradient } from "@/components/remocn/shader-grain-gradient";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#3a3a52", "#4a4a68", "#8f88ae"];

export type WaveWipeProps = {
  colors?: string[];
  colorBack?: string;
  intensity?: number;
  softness?: number;
  noise?: number;
  zoom?: number;
  speed?: number;
};

const WaveWipePresentation: React.FC<
  TransitionPresentationComponentProps<WaveWipeProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colors = DEFAULT_COLORS,
    colorBack = "#141318",
    intensity = 0.2,
    softness = 0.7,
    noise = 0.4,
    zoom = 1.16,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.3, 0.5], [1, 0], {
        ...clampOpts,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      transform: `translateY(${interpolate(p, [0, 0.7], [0, -70], {
        ...clampOpts,
        easing: Easing.in(Easing.cubic),
      })}%)`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  const fieldOpacity = interpolate(p, [0.18, 0.45], [0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });
  const drift = interpolate(p, [0, 1], [0, 0.7], {
    ...clampOpts,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const rise = interpolate(p, [0.4, 0.82, 1], [100, -3.5, 0], {
    ...clampOpts,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fieldOpacity, pointerEvents: "none" }}>
        <ShaderGrainGradient
          speed={speed}
          shape="wave"
          colors={colors}
          colorBack={colorBack}
          intensity={intensity}
          softness={softness}
          noise={noise}
          scale={zoom}
          offsetY={drift}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateY(${rise}%)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function waveWipe(
  props: WaveWipeProps = {},
): TransitionPresentation<WaveWipeProps> {
  return {
    component: WaveWipePresentation,
    props,
  };
}
