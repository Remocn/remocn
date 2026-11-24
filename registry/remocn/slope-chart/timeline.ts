import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The axes drawing in with their headings, the grey lines drawing one after
// another, then the hero line climbing and the stat landing at its tip.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type SlopeChartElementId =
  | "axes"
  | "headings"
  | `line:${number}`
  | "climb"
  | "hit";

export interface SlopeChartTimingProps {
  lines?: { before: number; after: number }[];
  /** Frames between grey lines as they draw in. */
  stagger?: number;
  /** Frame the hero line starts to climb; the stat lands with it. */
  climbAt?: number;
}

export const DEFAULT_LINES = [
  { before: 14, after: 16 },
  { before: 20, after: 18 },
  { before: 10, after: 13 },
  { before: 24, after: 22 },
  { before: 17, after: 20 },
  { before: 3, after: 5 },
  { before: 28, after: 27 },
];

export const GREY_STAGGER = 4;
export const CLIMB_AT = 60;
/** At most this many grey lines are drawn. */
export const MAX_GREYS = 8;

const AXES = [0, 16] as const;
const HEADINGS = [6, 22] as const;
const GREY_AT = 12;
const GREY_DRAW = 24;
const CLIMB_LEN = 40;
const HIT_AFTER = 38;

// `axes` draw in and `headings` rise under them. `line:<i>` draws grey line
// `i` over its length, `stagger` after the one before it (a chain); its start
// dot pops over `dot`, its values show around its start and end. `climb` is
// the hero line climbing: its start dot springs from `dot` and its left value
// shows from `value` (both before the start), the grey lines dim from `dimAt`
// over `dim`, and the camera starts sliding over at `slideAt`. `hit`
// (following the climb) is the stat landing over its length: it fades in over
// `fade` and the label rises from `labelAt`; the camera's slide ends at
// `slideEnd` and its push at `settle`.
export const slopeChartTimeline = defineTimeline<
  SlopeChartElementId,
  SlopeChartTimingProps
>(({ lines = DEFAULT_LINES, stagger = GREY_STAGGER, climbAt = CLIMB_AT }) => {
  const greys = lines.slice(0, MAX_GREYS);
  const hitAt = climbAt + HIT_AFTER;
  const elements: TimelineElement<SlopeChartElementId>[] = [
    {
      id: "axes",
      lane: "Axes",
      label: "Axes",
      start: AXES[0],
      length: AXES[1] - AXES[0],
    },
    {
      id: "headings",
      lane: "Axes",
      label: "Headings",
      start: HEADINGS[0],
      length: HEADINGS[1] - HEADINGS[0],
    },
  ];
  greys.forEach((l, i) => {
    elements.push({
      id: `line:${i}`,
      lane: "Lines",
      label: `${l.before} → ${l.after}`,
      start: GREY_AT + i * stagger,
      length: GREY_DRAW,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { dot: 6 },
    });
  });
  elements.push(
    {
      id: "climb",
      lane: "Hero",
      label: "Climb",
      start: climbAt,
      length: CLIMB_LEN,
      beats: { dot: -6, value: -6, dimAt: -2, dim: 22, slideAt: 8 },
    },
    {
      id: "hit",
      lane: "Hero",
      label: "Stat",
      start: hitAt,
      length: 26,
      follows: "climb",
      beats: { fade: 6, labelAt: 8, slideEnd: 14, settle: 30 },
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
