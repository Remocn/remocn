import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The year of contributions: the grid fading up, the camera easing in and
// drifting, the month and day axis, the diagonal sweep that lights the
// cells, the grid settling back and dimming, the total landing and counting
// up, and its label. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ContributionHeatmapElementId =
  | "stage"
  | "zoom"
  | "drift"
  | "axis"
  | "sweep"
  | "settle"
  | "total"
  | "label";

/** The scene's timing does not depend on its props. */
export type ContributionHeatmapTimingProps = object;

const SWEEP = [4, 50] as const;
const CELL_IN = 10;
const HIT = 62;

// `axis` fades the labels in, each month `stagger` after the one before.
// `sweep` starts the cells over `spread` frames along the diagonal, each
// popping in over `cell` and flashing to `flashPeak`, out by `flash`.
// `settle` follows the sweep and fades the axis out over `axisOut`; the
// `total` lands over `land` and counts up over its length; `label` follows.
export const contributionHeatmapTimeline = defineTimeline<
  ContributionHeatmapElementId,
  ContributionHeatmapTimingProps
>((): TimelineElement<ContributionHeatmapElementId>[] => [
  { id: "stage", lane: "Grid", label: "fade up", start: 0, length: 8 },
  { id: "zoom", lane: "Camera", label: "zoom", start: 0, length: HIT - 2 },
  { id: "drift", lane: "Camera", label: "drift", start: 0, length: HIT + 60 },
  {
    id: "axis",
    lane: "Axis",
    label: "axis",
    start: 2,
    length: 12,
    beats: { stagger: 1.5 },
  },
  {
    id: "sweep",
    lane: "Grid",
    label: "sweep",
    start: SWEEP[0],
    length: SWEEP[1] - SWEEP[0] + CELL_IN,
    beats: {
      spread: SWEEP[1] - SWEEP[0],
      cell: CELL_IN,
      flashPeak: 3,
      flash: 13,
    },
  },
  {
    id: "settle",
    lane: "Grid",
    label: "settle",
    start: HIT - 4,
    length: 26,
    follows: "sweep",
    beats: { axisOut: 10 },
  },
  {
    id: "total",
    lane: "Total",
    label: "total",
    start: HIT + 6,
    length: 28,
    follows: "settle",
    beats: { land: 20 },
  },
  {
    id: "label",
    lane: "Total",
    label: "label",
    start: HIT + 14,
    length: 18,
    follows: "total",
  },
]);
