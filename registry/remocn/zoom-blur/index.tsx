"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill } from "remotion";

export type ZoomBlurProps = {
  blur?: number;
  rise?: number;
};

const ZoomBlurPresentation: React.FC<
  TransitionPresentationComponentProps<ZoomBlurProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const { blur = 16, rise = 0 } = passedProps;
  const entering = presentationDirection === "entering";
  const p = presentationProgress;

  const style: React.CSSProperties = entering
    ? {
        opacity: p,
        transform: `scale(${0.9 + p * 0.1})${
          rise > 0 ? ` translateY(${(1 - p) * rise}px)` : ""
        }`,
        filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined,
      }
    : {
        opacity: 1 - p,
        transform: `scale(${1 + p * 0.12})${
          rise > 0 ? ` translateY(${-p * rise}px)` : ""
        }`,
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
