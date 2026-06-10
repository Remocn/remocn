"use client";

import {
  easings,
  type Step,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  skeletonStyle,
  type SkeletonState,
  type SkeletonStyle,
} from "@/components/remocn/skeleton";
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 12;

/**
 * Blend two skeleton visuals: both opacities lerp. They stay summing to 1
 * because the endpoints do and a lerp of two complementary pairs is complementary
 * — so the crossfade never dims the box. No animated colors here.
 */
export function tweenSkeletonStyle(
  a: SkeletonStyle,
  b: SkeletonStyle,
  t: number,
): SkeletonStyle {
  return {
    skeletonOpacity:
      a.skeletonOpacity + (b.skeletonOpacity - a.skeletonOpacity) * t,
    contentOpacity:
      a.contentOpacity + (b.contentOpacity - a.contentOpacity) * t,
  };
}

export interface SkeletonTransitionOptions {
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

/**
 * Timeline → resolved (eased, tweened) SkeletonStyle. The CALLER invokes this; it
 * reads the frame, the `<Skeleton>` component does not. Feed the result to
 * `<Skeleton style={...} />` for a smooth loading→loaded crossfade.
 */
export function useSkeletonTransition(
  steps: Step<SkeletonState>[],
  opts: SkeletonTransitionOptions = {},
): SkeletonStyle {
  const { speed = 1, defaultDuration = DEFAULT_DURATION } = opts;
  const { from, to, progress } = useStateTransition(
    steps,
    "loading",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenSkeletonStyle(skeletonStyle(from), skeletonStyle(to), t);
}
