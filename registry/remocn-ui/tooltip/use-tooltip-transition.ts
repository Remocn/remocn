"use client";

import {
  easings,
  type Step,
  useStateTransition,
} from "@/lib/remocn-ui";
import {
  tooltipStyle,
  type TooltipState,
  type TooltipStyle,
} from "@/components/remocn/tooltip";
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 8;

/**
 * Blend two tooltip visuals: every field lerps. `TooltipStyle` carries no
 * animated colors (the bubble bg/fg are static per theme), so there is no
 * `mixOklch` here — but every field is covered so neither show nor hide freezes
 * a channel.
 */
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

/**
 * Timeline → resolved (eased, tweened) TooltipStyle. The CALLER invokes this; it
 * reads the frame, the `<Tooltip>` component does not. Feed the result to
 * `<Tooltip style={...} />`. Both the show (hidden→visible) and the hide
 * (visible→hidden) read from the same eased tween, so both look smooth.
 */
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
