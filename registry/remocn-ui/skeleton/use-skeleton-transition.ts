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

export const DEFAULT_DURATION = 12;

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
