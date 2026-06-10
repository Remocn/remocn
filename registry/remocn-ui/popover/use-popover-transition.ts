"use client";

import { easings, type Step, useStateTransition } from "@/lib/remocn-ui";
import {
  popoverStyle,
  type PopoverState,
  type PopoverStyle,
} from "@/components/remocn/popover";
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/** Default transition length (frames) when a step omits `duration`. Tune to taste. */
export const DEFAULT_DURATION = 10;

/**
 * Blend two popover visuals: every field lerps. `PopoverStyle` carries no
 * animated colors (the card bg/fg/border are static per theme), so there is no
 * `mixOklch` here — but every field is covered so neither open nor close freezes
 * a channel.
 */
export function tweenPopoverStyle(
  a: PopoverStyle,
  b: PopoverStyle,
  t: number,
): PopoverStyle {
  return {
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    translate: a.translate + (b.translate - a.translate) * t,
  };
}

export interface PopoverTransitionOptions {
  mode?: "light" | "dark";
  speed?: number;
  defaultDuration?: number;
}

/**
 * Timeline → resolved (eased, tweened) PopoverStyle. The CALLER invokes this; it
 * reads the frame, the `<Popover>` component does not. Feed the result to
 * `<Popover style={...} />`. Both the open (closed→opened) and the close
 * (opened→closed) read from the same eased tween, so both look smooth.
 */
export function usePopoverTransition(
  steps: Step<PopoverState>[],
  opts: PopoverTransitionOptions = {},
): PopoverStyle {
  const { speed = 1, defaultDuration = DEFAULT_DURATION } = opts;
  const { from, to, progress } = useStateTransition(
    steps,
    "closed",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenPopoverStyle(popoverStyle(from), popoverStyle(to), t);
}
