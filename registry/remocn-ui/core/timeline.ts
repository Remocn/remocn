import { useCurrentFrame } from "remotion";
import type { Step } from "./types";

export function framesFor(d: number | { seconds: number }, fps: number): number {
  return typeof d === "number" ? d : Math.round(d.seconds * fps);
}

export function revealCount(
  localFrame: number,
  fps: number,
  len: number,
  cps: number,
): number {
  const over = (len / cps) * fps;
  if (over <= 0) return len;
  return Math.max(0, Math.min(len, Math.floor((localFrame / over) * len)));
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function useCurrentState<S extends string>(
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
): S {
  const effectiveFrame = useCurrentFrame() * speed;
  let current = defaultState;
  let bestAt = -Infinity;
  steps.forEach((step) => {
    if (step.at <= effectiveFrame && step.at >= bestAt) {
      bestAt = step.at;
      current = step.state;
    }
  });
  return current;
}

export function useStateTransition<S extends string>(
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
  defaultDuration = 8,
): { from: S; to: S; progress: number } {
  const effectiveFrame = useCurrentFrame() * speed;
  const started = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => a.step.at - b.step.at || a.index - b.index)
    .filter((e) => e.step.at <= effectiveFrame);
  if (started.length === 0)
    return { from: defaultState, to: defaultState, progress: 1 };
  const to = started[started.length - 1].step;
  const from = started.length >= 2 ? started[started.length - 2].step : null;
  const dur = to.duration ?? defaultDuration;
  const progress = dur > 0 ? clamp01((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}
