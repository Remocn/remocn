"use client";

import { useCurrentFrame } from "remotion";
import type { StepperStyle } from "@/components/remocn/stepper";
import { clamp01, type EasingName, easings } from "@/lib/remocn-ui";

export interface StepperStep {
  at: number;
  index: number;
  duration?: number;
  easing?: EasingName;
}

export const DEFAULT_DURATION = 24;

export interface StepperTransitionOptions {
  speed?: number;
  defaultDuration?: number;
}

export function tweenStepperStyle(
  a: StepperStyle,
  b: StepperStyle,
  t: number,
): StepperStyle {
  return { position: a.position + (b.position - a.position) * t };
}

export function useStepperTransition(
  steps: StepperStep[],
  opts: StepperTransitionOptions = {},
): StepperStyle {
  const { speed = 1 } = opts;
  const raw = useCurrentFrame() * speed;
  return stepperStyleAt(steps, raw, opts);
}

export function stepperStyleAt(
  steps: StepperStep[],
  raw: number,
  opts: StepperTransitionOptions = {},
): StepperStyle {
  const { defaultDuration = DEFAULT_DURATION } = opts;

  if (steps.length === 0) return { position: 0 };

  const first = steps[0];

  if (raw <= first.at) return { position: first.index };

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
  const position = from.index + (to.index - from.index) * t;

  return { position };
}
