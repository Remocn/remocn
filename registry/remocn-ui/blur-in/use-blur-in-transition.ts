"use client";

import {
  easings,
  type Step,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  blurInStyle,
  blurInStyleContext,
  type BlurInDirection,
  type BlurInState,
  type BlurInStyle,
} from "@/components/remocn/blur-in";

export const DEFAULT_DURATION = 18;

export function tweenBlurInStyle(
  a: BlurInStyle,
  b: BlurInStyle,
  t: number,
): BlurInStyle {
  return {
    blur: a.blur + (b.blur - a.blur) * t,
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    translateX: a.translateX + (b.translateX - a.translateX) * t,
    translateY: a.translateY + (b.translateY - a.translateY) * t,
  };
}

export interface BlurInTransitionOptions {
  blur?: number;
  direction?: BlurInDirection;
  distance?: number;
  speed?: number;
  defaultDuration?: number;
}

export function useBlurInTransition(
  steps: Step<BlurInState>[],
  opts: BlurInTransitionOptions = {},
): BlurInStyle {
  const {
    blur = 8,
    direction = "up",
    distance = 12,
    speed = 1,
    defaultDuration = DEFAULT_DURATION,
  } = opts;
  const ctx = blurInStyleContext(blur, direction, distance);
  const { from, to, progress } = useStateTransition(
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenBlurInStyle(blurInStyle(from, ctx), blurInStyle(to, ctx), t);
}
