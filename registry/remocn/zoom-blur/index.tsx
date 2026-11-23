"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill } from "remotion";
import { useGlide } from "@/lib/remocn/glide";

export type ZoomBlurProps = {
  blur?: number;
  rise?: number;
};

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

const ZoomBlurPresentation: React.FC<
  TransitionPresentationComponentProps<ZoomBlurProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const glide = useGlide();
  const { blur = 16, rise = 0 } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;
  // The scene is scaled away from the frame edges for the whole move, so the
  // tilt opens no seam there.
  const tilt = glide(midway(p));

  const style: React.CSSProperties = entering
    ? {
        opacity: p,
        transform: `scale(${0.9 + p * 0.1})${
          rise > 0 ? ` translateY(${(1 - p) * rise}px)` : ""
        }${tilt}`,
        filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined,
      }
    : {
        opacity: 1 - p,
        transform: `scale(${1 + p * 0.12})${
          rise > 0 ? ` translateY(${-p * rise}px)` : ""
        }${tilt}`,
        filter: p > 0 ? `blur(${p * blur}px)` : undefined,
      };

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export function zoomBlur(
  props: ZoomBlurProps = {},
): TransitionPresentation<ZoomBlurProps> {
  return {
    component: ZoomBlurPresentation,
    props,
  };
}
