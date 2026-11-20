"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { useGlide } from "@/lib/remocn/glide";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export type FocusPullProps = {
  blur?: number;
};

const FocusPullPresentation: React.FC<
  TransitionPresentationComponentProps<FocusPullProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const glide = useGlide();
  const { blur = 16 } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  if (!entering) {
    const push = interpolate(p, [0, 0.6], [1, 1.05], {
      ...clampOpts,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, [0.42, 0.68], [1, 0], {
        ...clampOpts,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      // `transform` rather than `scale`: the mark that leans the scene's text
      // rides on `transform` only.
      transform: `scale(${push})${glide(midway(interpolate(p, [0, 0.6], [0, 1], clampOpts)))}`,
      filter: `blur(${interpolate(p, [0.05, 0.55], [0, blur], {
        ...clampOpts,
        easing: Easing.in(Easing.quad),
      })}px) brightness(${interpolate(p, [0.1, 0.55], [1, 1.3], clampOpts)})`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  const settle = interpolate(p, [0.35, 1], [0, 1], clampOpts);
  const childStyle: React.CSSProperties = {
    opacity: interpolate(p, [0.32, 0.52], [0, 1], clampOpts),
    transform: `scale(${interpolate(p, [0.35, 1], [0.97, 1], {
      ...clampOpts,
      easing: Easing.out(Easing.cubic),
    })})${glide(midway(settle))}`,
    filter: `blur(${interpolate(p, [0.35, 0.9], [blur, 0], {
      ...clampOpts,
      easing: Easing.out(Easing.quad),
    })}px) brightness(${interpolate(p, [0.4, 0.85], [1.25, 1], clampOpts)})`,
  };

  return <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>;
};

export function focusPull(
  props: FocusPullProps = {},
): TransitionPresentation<FocusPullProps> {
  return {
    component: FocusPullPresentation,
    props,
  };
}
