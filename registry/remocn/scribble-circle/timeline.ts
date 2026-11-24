import { defineTimeline } from "@/lib/remocn/timeline";

// The circle is scribbled in one stroke, on the stop-motion grid. Frames on
// the 30 fps scene timeline; the stroke starts at `delay`. The ids are
// public: a saved `timing` prop refers to them.

export type ScribbleCircleElementId = "draw";

export interface ScribbleCircleTimingProps {
  delay?: number;
  durationSteps?: number;
  step?: number;
}

/** Same as `DEFAULT_STEP` in stop-motion; kept here so the schedule imports nothing else. */
const STEP = 3;

export const scribbleCircleTimeline = defineTimeline<
  ScribbleCircleElementId,
  ScribbleCircleTimingProps
>(({ delay = 0, durationSteps = 10, step = STEP }) => [
  {
    id: "draw",
    lane: "Stroke",
    label: "scribble",
    start: delay,
    length: durationSteps * step,
  },
]);
