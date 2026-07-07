"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ShaderSwirl } from "@/components/remocn/shader-swirl";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEFAULT_COLORS = ["#1f1d29", "#413d56", "#8f88ae"];

export type SwirlDissolveProps = {
  colors?: string[];
  colorBack?: string;
  bandCount?: number;
  softness?: number;
  speed?: number;
};

const SwirlDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<SwirlDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    colors = DEFAULT_COLORS,
    colorBack = "#141318",
    bandCount = 10,
    softness = 0.35,
    speed = 1,
  } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  const twist = interpolate(p, [0.1, 0.42, 0.64, 1], [1, 0, 0, 1], {
    ...clampOpts,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });

  const childStyle: React.CSSProperties = entering
    ? {
        opacity: interpolate(p, [0.77, 0.87], [0, 1], clampOpts),
        transform: `scale(${interpolate(p, [0.77, 1], [0.3, 1], {
          ...clampOpts,
          easing: Easing.out(Easing.cubic),
        })})`,
        filter: `blur(${interpolate(p, [0.77, 0.93], [10, 0], clampOpts)}px)`,
      }
    : { opacity: interpolate(p, [0.06, 0.13], [1, 0], clampOpts) };

  return (
    <AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <ShaderSwirl
            speed={speed}
            twist={twist}
            colors={colors}
            colorBack={colorBack}
            bandCount={bandCount}
            softness={softness}
          />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export function swirlDissolve(
  props: SwirlDissolveProps = {},
): TransitionPresentation<SwirlDissolveProps> {
  return {
    component: SwirlDissolvePresentation,
    props,
  };
}
