import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in, then each swap growing the line onto the next, nearer
// step. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type OnApproachElementId = "intro" | `step:${number}`;

export interface OnApproachTimingProps {
  steps?: string[];
  /** Frames between swaps. */
  interval?: number;
  /** Frame of the first swap. */
  swapAt?: number;
}

export const DEFAULT_STEPS = ["in June.", "next week.", "tomorrow.", "today."];
/** The line rises in from `IN` over `INTRO`. */
const IN = 2;
const INTRO = 18;
const FIRST = 36;
const INTERVAL = 30;
/** Swaps are never closer than this. */
const MIN_INTERVAL = 16;
/** A swap grows the line onto the next step over `GROW`. */
const GROW = 18;

/** The steps shown, one when none are given. */
export function stepsOf(steps: string[]) {
  return steps.length > 0 ? steps : ["today."];
}

// `step:<k>` is the swap onto step `k`; the step showing is the last swap
// that has started.
export const onApproachTimeline = defineTimeline<
  OnApproachElementId,
  OnApproachTimingProps
>(({ steps = DEFAULT_STEPS, interval = INTERVAL, swapAt = FIRST }) => {
  const list = stepsOf(steps);
  const stepAt = (k: number) =>
    swapAt + (k - 1) * Math.max(MIN_INTERVAL, interval);
  const elements: TimelineElement<OnApproachElementId>[] = [
    {
      id: "intro",
      lane: "Line",
      label: list[0],
      start: IN,
      length: INTRO,
    },
  ];
  for (let k = 1; k < list.length; k++) {
    elements.push({
      id: `step:${k}`,
      lane: "Steps",
      label: list[k],
      start: stepAt(k),
      length: GROW,
      follows: k > 1 ? `step:${k - 1}` : "intro",
    });
  }
  return elements;
});
