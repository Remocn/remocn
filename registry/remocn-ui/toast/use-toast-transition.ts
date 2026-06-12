"use client";

import {
  easings,
  type Step,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  toastStyle,
  type ToastState,
  type ToastStyle,
} from "@/components/remocn/toast";

export const DEFAULT_DURATION = 12;

export function tweenToastStyle(
  a: ToastStyle,
  b: ToastStyle,
  t: number,
): ToastStyle {
  return {
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    translateY: a.translateY + (b.translateY - a.translateY) * t,
    scale: a.scale + (b.scale - a.scale) * t,
  };
}

export interface ToastTransitionOptions {
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useToastTransition(
  steps: Step<ToastState>[],
  opts: ToastTransitionOptions = {},
): ToastStyle {
  const { speed = 1, defaultDuration = DEFAULT_DURATION } = opts;
  const { from, to, progress } = useStateTransition(
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenToastStyle(toastStyle(from), toastStyle(to), t);
}
