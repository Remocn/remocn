"use client";

import { useCurrentFrame } from "remotion";
import { clamp01, type EasingName, easings } from "@/lib/remocn-ui";
import type { ProgressStyle } from "@/components/remocn/progress";

export interface ProgressStep {
  at: number;
  value: number;
  duration?: number;
  easing?: EasingName;
}

export const DEFAULT_DURATION = 24;

export interface ProgressTransitionOptions {
  speed?: number;
  defaultDuration?: number;
}

export function tweenProgressStyle(
  a: ProgressStyle,
  b: ProgressStyle,
  t: number,
): ProgressStyle {
  return { value: a.value + (b.value - a.value) * t };
}

export function useProgressTransition(
  steps: ProgressStep[],
  opts: ProgressTransitionOptions = {},
): ProgressStyle {
  const { speed = 1 } = opts;
  const raw = useCurrentFrame() * speed;
  return progressValueAt(steps, raw, opts);
}

export function progressValueAt(
  steps: ProgressStep[],
  raw: number,
  opts: ProgressTransitionOptions = {},
): ProgressStyle {
  const { defaultDuration = DEFAULT_DURATION } = opts;

  if (steps.length === 0) return { value: 0 };

  const first = steps[0];

  if (raw <= first.at) return { value: first.value };

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
  const start = to.at - dur;
  const t = pastLast || dur <= 0 ? 1 : ease(clamp01((raw - start) / dur));
  const value = from.value + (to.value - from.value) * t;

  return { value };
}
