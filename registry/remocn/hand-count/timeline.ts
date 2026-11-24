import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When the hand-drawn number counts up. Frames on the 30 fps scene timeline.
// The ids are public: a saved `timing` prop refers to them.

export type HandCountElementId = "count";

export interface HandCountTimingProps {
  /** Frames before the count starts. */
  delay?: number;
  /** Poses the count takes, each `step` frames long. */
  durationSteps?: number;
  step?: number;
}

export const DEFAULT_DURATION_STEPS = 18;
/** Frames a stop-motion pose holds, as in `@/lib/remocn/stop-motion`. */
const STEP = 3;

export const handCountTimeline = defineTimeline<
  HandCountElementId,
  HandCountTimingProps
>(
  ({
    delay = 0,
    durationSteps = DEFAULT_DURATION_STEPS,
    step = STEP,
  }): TimelineElement<HandCountElementId>[] => [
    {
      id: "count",
      lane: "Count",
      label: "count",
      start: delay,
      length: durationSteps * step,
    },
  ],
);
