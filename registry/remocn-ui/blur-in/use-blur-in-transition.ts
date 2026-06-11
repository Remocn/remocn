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
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 18;

/** Blend two blur-in visuals: every field is a number, so all four lerp linearly. */
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

/**
 * Timeline → resolved (eased, tweened) BlurInStyle. The CALLER invokes this; it
 * reads the frame, the `<BlurIn>` component does not. Feed the result to
 * `<BlurIn style={...} />` for smooth transitions.
 */
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
