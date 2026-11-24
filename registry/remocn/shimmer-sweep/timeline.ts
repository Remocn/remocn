import { defineTimeline } from "@/lib/remocn/timeline";

// The shine crossing the text once. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type ShimmerSweepElementId = "sweep";

export interface ShimmerSweepTimingProps {
  text: string;
}

/** Share of the scene the sweep takes; the rest holds the plain text. */
const SWEEP = 0.8;

export const shimmerSweepTimeline = defineTimeline<
  ShimmerSweepElementId,
  ShimmerSweepTimingProps
>(({ text }, { length }) => [
  {
    id: "sweep",
    lane: "Shine",
    label: text,
    start: 0,
    length: length * SWEEP,
  },
]);
