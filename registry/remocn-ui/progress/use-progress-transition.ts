"use client";

import { useCurrentFrame } from "remotion";
import { clamp01, type EasingName, easings } from "@/lib/remocn-ui";
import type { ProgressStyle } from "@/components/remocn/progress";
// ^ install path; resolves in-repo via the @/components/remocn/* tsconfig alias.

/**
 * A scripted progress value the bar eases TO. The fill tweens from the previous
 * step's value to this one over `[at, at + (duration ?? DEFAULT_DURATION))`.
 */
export interface ProgressStep {
  /** LOCAL (Sequence-relative) authored frame the bar finishes reaching `value`. */
  at: number;
  /** Target fill percentage 0–100. */
  value: number;
  /** Frames the move INTO this value takes. Omitted → DEFAULT_DURATION. */
  duration?: number;
  /** Override the easing for the move into this value. Default `out`. */
  easing?: EasingName;
}

/** Default frames for a move into a step when it omits `duration`. */
export const DEFAULT_DURATION = 24;

export interface ProgressTransitionOptions {
  /** Playhead scale (effectiveFrame = useCurrentFrame() * speed). */
  speed?: number;
  /** Move duration (frames) when a step omits `duration`. */
  defaultDuration?: number;
}

/** Blend two progress visuals: the single numeric `value` field lerps. */
export function tweenProgressStyle(
  a: ProgressStyle,
  b: ProgressStyle,
  t: number,
): ProgressStyle {
  return { value: a.value + (b.value - a.value) * t };
}

/**
 * Resolve the bar's `ProgressStyle` for a value timeline. THIS is the only
 * frame-reading file in the component — `<Progress>` itself stays pure. Mirrors
 * the value-channel deviation (like cursor's `useCursorPath`): instead of a
 * string-state timeline it folds a numeric value path.
 *
 * The fold is a pure function of `raw = useCurrentFrame() * speed`; the tests
 * replicate `progressValueAt(steps, raw, opts)` with the frame injected.
 */
export function useProgressTransition(
  steps: ProgressStep[],
  opts: ProgressTransitionOptions = {},
): ProgressStyle {
  const { speed = 1 } = opts;
  const raw = useCurrentFrame() * speed;
  return progressValueAt(steps, raw, opts);
}

/**
 * Pure core of `useProgressTransition` with the effective frame injected as
 * `raw`. Kept separate so it can be unit-tested without a Remotion render.
 * `useProgressTransition` is exactly `progressValueAt(steps, useCurrentFrame() *
 * speed, opts)`.
 */
export function progressValueAt(
  steps: ProgressStep[],
  raw: number,
  opts: ProgressTransitionOptions = {},
): ProgressStyle {
  const { defaultDuration = DEFAULT_DURATION } = opts;

  if (steps.length === 0) return { value: 0 };

  // Authored order is the timeline order; `at` is the arrival frame of each step.
  const first = steps[0];

  // Before the first arrival, hold at the first step's value (no teleport).
  if (raw <= first.at) return { value: first.value };

  // Find the segment we're in: the move from step i-1 into step i, where i is
  // the first step with at > raw. If none, we're resting at the last step.
  let toIndex = steps.length - 1;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].at > raw) {
      toIndex = i;
      break;
    }
  }
  const pastLast = raw >= steps[steps.length - 1].at;
  const to = pastLast ? steps[steps.length - 1] : steps[toIndex];
  const from = pastLast ? steps[steps.length - 1] : steps[toIndex - 1];

  const dur = to.duration ?? defaultDuration;
  const ease = easings[to.easing ?? "out"];
  // The move runs over [start, to.at); start = to.at - dur.
  const start = to.at - dur;
  const t = pastLast || dur <= 0 ? 1 : ease(clamp01((raw - start) / dur));
  const value = from.value + (to.value - from.value) * t;

  return { value };
}
