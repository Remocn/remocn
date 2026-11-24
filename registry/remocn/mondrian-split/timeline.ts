import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line of the grid drawing in, each coloured cell wiping in, the field
// filling the chosen cell, the lines sliding to their new tracks and the
// field pushing out to the frame's edges side by side. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type MondrianSplitElementId =
  | `line:${number}`
  | `fill:${number}`
  | "field"
  | `track:${number}`
  | `push:${number}`;

export interface MondrianSplitTimingProps {
  splits?: number;
}

export const DEFAULT_SPLITS = 7;
export const LINE_START = 3;
export const LINE_GAP = 5;
export const LINE_DRAW = 10;
const FILL_LAG = 7;
export const FILL_GAP = 4;
export const FILL_WIPE = 9;
const FIELD_LAG = 6;
export const FIELD_WIPE = 12;
const HOLD = 14;
export const TRACK_COUNT = 3;
export const TRACK_GAP = 5;
export const TRACK_SLIDE = 20;
const EXPAND_LEAD = 4;
export const SIDE_GAP = 3;
export const SIDE_PUSH = 22;
const SIDE_COUNT = 4;

const clampTo = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The number of lines `splits` asks for, 3 to 12. */
export const splitCount = (splits: number) =>
  Math.round(clampTo(Number.isFinite(splits) ? splits : DEFAULT_SPLITS, 3, 12));
/** How many cells get a colour for `count` lines. */
export const coloredCount = (count: number) =>
  clampTo(Math.round(count * 0.3), 1, 5);

/** When each phase of the build begins, for `splits` lines. */
export function mondrianPhasesOf(splits: number) {
  const count = splitCount(splits);
  const fill = LINE_START + (count - 1) * LINE_GAP + FILL_LAG;
  const field = fill + (coloredCount(count) - 1) * FILL_GAP + FIELD_LAG;
  const reflow = field + FIELD_WIPE + HOLD;
  const settled = reflow + (TRACK_COUNT - 1) * TRACK_GAP + TRACK_SLIDE;
  const expand = settled - EXPAND_LEAD;
  const end = expand + (SIDE_COUNT - 1) * SIDE_GAP + SIDE_PUSH;
  return { lines: LINE_START, fill, field, reflow, expand, end };
}

// `line:<i>` draws cut `i`; `fill:<k>` wipes the `k`th coloured cell in,
// along the diagonal; `field` fills the cell that expands; `track:<k>` is
// the `k`th line track to slide (fewer slide when the grid has no room);
// `push:<k>` pushes the field's `k`th nearest side out to the frame's edge.
// Each list is a chain, and each phase follows the one before it. Which
// line, cell, track and side takes each slot is decided by the seeded
// layout, not by the schedule.
export const mondrianSplitTimeline = defineTimeline<
  MondrianSplitElementId,
  MondrianSplitTimingProps
>(({ splits = DEFAULT_SPLITS }) => {
  const count = splitCount(splits);
  const phase = mondrianPhasesOf(count);
  const out: TimelineElement<MondrianSplitElementId>[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `line:${i}`,
      lane: "Lines",
      label: `line ${i + 1}`,
      start: LINE_START + i * LINE_GAP,
      length: LINE_DRAW,
      follows: i > 0 ? `line:${i - 1}` : undefined,
    });
  }
  const fills = coloredCount(count);
  for (let k = 0; k < fills; k++) {
    out.push({
      id: `fill:${k}`,
      lane: "Colour",
      label: `colour ${k + 1}`,
      start: phase.fill + k * FILL_GAP,
      length: FILL_WIPE,
      follows: k > 0 ? `fill:${k - 1}` : `line:${count - 1}`,
    });
  }
  out.push({
    id: "field",
    lane: "Colour",
    label: "field",
    start: phase.field,
    length: FIELD_WIPE,
    follows: `fill:${fills - 1}`,
  });
  for (let k = 0; k < TRACK_COUNT; k++) {
    out.push({
      id: `track:${k}`,
      lane: "Tracks",
      label: `track ${k + 1}`,
      start: phase.reflow + k * TRACK_GAP,
      length: TRACK_SLIDE,
      follows: k > 0 ? `track:${k - 1}` : "field",
    });
  }
  for (let k = 0; k < SIDE_COUNT; k++) {
    out.push({
      id: `push:${k}`,
      lane: "Expand",
      label: `side ${k + 1}`,
      start: phase.expand + k * SIDE_GAP,
      length: SIDE_PUSH,
      follows: k > 0 ? `push:${k - 1}` : `track:${TRACK_COUNT - 1}`,
    });
  }
  return out.sort((a, b) => a.start - b.start);
});
