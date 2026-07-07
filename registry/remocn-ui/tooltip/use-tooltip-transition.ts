"use client";

import {
  type TooltipState,
  type TooltipStyle,
  tooltipStyle,
} from "@/components/remocn/tooltip";
import { easings, type Step, useStateTransition } from "@/lib/remocn-ui";

export const DEFAULT_DURATION = 8;

export function tweenTooltipStyle(
  a: TooltipStyle,
  b: TooltipStyle,
  t: number,
): TooltipStyle {
  return {
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    translate: a.translate + (b.translate - a.translate) * t,
  };
}

export interface TooltipTransitionOptions {
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

export function useTooltipTransition(
  steps: Step<TooltipState>[],
  opts: TooltipTransitionOptions = {},
): TooltipStyle {
  const { speed = 1, defaultDuration = DEFAULT_DURATION } = opts;
  const { from, to, progress } = useStateTransition(
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenTooltipStyle(tooltipStyle(from), tooltipStyle(to), t);
}
