import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first tile drawing in, three quarter turns around its corner, the
// rosette mirrored across the axis, the block slid sideways and then up and
// down into a wall, and the first tile picked out at the end; the camera
// pulls back in three moves while it builds. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type PatternTileElementId =
  | "tile"
  | "labels"
  | `camera:${number}`
  | `rotate:${number}`
  | "mirror"
  | "slide-x"
  | "slide-y"
  | "focus";

/** The scene's timing does not depend on its props. */
export type PatternTileTimingProps = object;

// `tile` fades in (`appear`), its edge draws (`edge`) and fades from
// `edgeFadeAt`, its disc sweeps from `sweepAt` and its bar grows from
// `growAt`. `camera:<k>` is one pull back, holding between them. Each
// `rotate:<k>` turns a copy a quarter further; the pivot dot shows from
// `pivotIn` to `pivotOn` of the first and fades `pivotOut` after the last.
// `mirror` flips the rosette; its axis shows from `axisIn`, grows until
// `axisGrown` and fades `axisOut` after it ends.
export const patternTileTimeline = defineTimeline<
  PatternTileElementId,
  PatternTileTimingProps
>((): TimelineElement<PatternTileElementId>[] => [
  {
    id: "tile",
    lane: "Tile",
    label: "first tile",
    start: 0,
    length: 28,
    beats: {
      appear: 12,
      edge: 22,
      edgeFadeAt: 28,
      edgeFade: 16,
      sweepAt: 6,
      sweep: 18,
      growAt: 14,
      grow: 14,
    },
  },
  {
    id: "labels",
    lane: "Labels",
    label: "steps",
    start: 4,
    length: 14,
  },
  {
    id: "camera:0",
    lane: "Camera",
    label: "pull back",
    start: 24,
    length: 40,
  },
  ...[32, 43, 54].map(
    (start, k): TimelineElement<PatternTileElementId> => ({
      id: `rotate:${k}`,
      lane: "Moves",
      label: `rotate ${90 * (k + 1)}°`,
      start,
      length: 11,
      follows: k > 0 ? `rotate:${k - 1}` : "tile",
      beats: { pivotIn: -4, pivotOn: 2, pivotOut: 8 },
    }),
  ),
  {
    id: "camera:1",
    lane: "Camera",
    label: "pull back",
    start: 66,
    length: 28,
    follows: "camera:0",
  },
  {
    id: "mirror",
    lane: "Moves",
    label: "mirror",
    start: 68,
    length: 24,
    follows: "rotate:2",
    beats: { axisIn: -4, axisOn: 4, axisGrown: 8, axisOut: 8 },
  },
  {
    id: "camera:2",
    lane: "Camera",
    label: "pull back",
    start: 96,
    length: 28,
    follows: "camera:1",
  },
  {
    id: "slide-x",
    lane: "Moves",
    label: "translate sideways",
    start: 98,
    length: 18,
    follows: "mirror",
  },
  {
    id: "slide-y",
    lane: "Moves",
    label: "translate up and down",
    start: 116,
    length: 18,
    follows: "slide-x",
  },
  {
    id: "focus",
    lane: "Focus",
    label: "first tile picked out",
    start: 140,
    length: 16,
    follows: "slide-y",
  },
]);
