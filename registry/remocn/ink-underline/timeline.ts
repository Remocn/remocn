import { defineTimeline } from "@/lib/remocn/timeline";

// When the underline is drawn. Frames on the 30 fps scene timeline; the
// stroke starts at `delay`. The ids are public: a saved `timing` prop refers
// to them.

export type InkUnderlineElementId = "stroke";

export interface InkUnderlineTimingProps {
  delay?: number;
  durationSteps?: number;
  step?: number;
}

/** Frames one stop-motion step holds, as `DEFAULT_STEP` in `stop-motion`. */
const STEP = 3;
const DURATION_STEPS = 5;

// `stroke` draws the underline over `durationSteps` steps of `step` frames.
export const inkUnderlineTimeline = defineTimeline<
  InkUnderlineElementId,
  InkUnderlineTimingProps
>(({ delay = 0, durationSteps = DURATION_STEPS, step = STEP }) => [
  {
    id: "stroke",
    lane: "Underline",
    label: "stroke",
    start: delay,
    length: durationSteps * step,
  },
]);
