import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The growth curve: the line drawing out with the camera on its tip, the
// camera pulling back to the whole curve, then the value landing at the tip.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type GrowthLineElementId = "draw" | "pull" | "hit";

/** The scene's timing does not depend on its props. */
export type GrowthLineTimingProps = object;

// `draw` runs the tip along the whole curve; the scene fades in from
// `fadeAt` over `fade` (the running count over `count`), and each milestone
// label rises from `markAt` after the tip reaches it, over `mark`. `pull`
// takes the camera back to the whole curve. `hit` lands the value: the
// frame kicks to its `peak` and settles by `kick`, the value fades in over
// `fade`, the ring spreads over `ring`, the label rises from `labelAt` over
// `label`, the count fades from `countAt` over `count` and the milestone
// labels quiet down from `quietAt` over `quiet`.
export const growthLineTimeline = defineTimeline<
  GrowthLineElementId,
  GrowthLineTimingProps
>((): TimelineElement<GrowthLineElementId>[] => [
  {
    id: "draw",
    lane: "Curve",
    label: "draw",
    start: -4,
    length: 122,
    beats: { fadeAt: 4, fade: 10, count: 6, markAt: 1, mark: 13 },
  },
  {
    id: "pull",
    lane: "Camera",
    label: "pull back",
    start: 84,
    length: 44,
    follows: "draw",
  },
  {
    id: "hit",
    lane: "Value",
    label: "value lands",
    start: 120,
    length: 28,
    follows: "draw",
    beats: {
      peak: 4,
      kick: 22,
      fade: 6,
      ring: 26,
      labelAt: 8,
      label: 20,
      countAt: -4,
      count: 6,
      quietAt: -6,
      quiet: 20,
    },
  },
]);
