import { defineTimeline } from "@/lib/remocn/timeline";

// The line drawing itself across the chart, with the dot riding its tip.
// Frames on the 30 fps scene timeline, after `speed`. The id is public: a
// saved `timing` prop refers to it.

export type AnimatedLineChartElementId = "draw";

/** Share of the clip the line takes to draw. */
const DRAW_SHARE = 0.85;

// `length` here is the clip length without `speed`, as the draw has always
// been sized; the line springs in over that share of it.
export const animatedLineChartTimeline = defineTimeline<
  AnimatedLineChartElementId,
  object
>((_, { length }) => [
  {
    id: "draw",
    lane: "Line",
    label: "Line draws",
    start: 0,
    length: Math.round(length * DRAW_SHARE),
  },
]);
