import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A wall of chevrons racing upward; column by column, from the centre out,
// three chevrons brake and lock into the giant chevron's band while the rest
// fly off; the pieces fuse into one gradient chevron, and the figure drops
// into the cut-out with the caption after it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type ChevronRunElementId =
  | "race"
  | `lock:${number}`
  | "fuse"
  | "land"
  | "caption";

export interface ChevronRunTimingProps {
  columns?: number;
}

export const COLS = 13;
const LOCK_AT = 48;
/** Each column further from the centre locks this much later. */
const LOCK_STEP = 1.3;
const LOCK_LEN = 14;
/** The rest of a column's wall clears from `leaveAt` to `leave`. */
const LEAVE_AT = -2;
const LEAVE = 10;
/** The wall's smear stops growing this long into the lock. */
const BLUR_CAP = 10;
const FUSE_AT = 74;
const FUSE = 12;
/** The solid chevron fades in from `solidAt`; it settles over `settle`. */
const SOLID_AT = 2;
const SETTLE = 20;
/** Its gradient drifts until frame 150. */
const DRIFT = 76;
const LAND_AT = 84;
const LAND = 14;
const CAPTION_AT = 8;
const CAPTION = 16;

// `race` is the wall speeding up until the first lock. `lock:<c>` is column
// `c` braking into the band; the columns lock from the centre out. `fuse`
// follows the outermost column, `land` and `caption` follow it in turn.
export const chevronRunTimeline = defineTimeline<
  ChevronRunElementId,
  ChevronRunTimingProps
>(({ columns = COLS }) => {
  const locks: TimelineElement<ChevronRunElementId>[] = [];
  for (let c = 0; c < columns; c++) {
    locks.push({
      id: `lock:${c}`,
      lane: "Locks",
      label: `column ${c + 1}`,
      start: LOCK_AT + Math.abs(c - (columns - 1) / 2) * LOCK_STEP,
      length: LOCK_LEN,
      beats: { leaveAt: LEAVE_AT, leave: LEAVE },
    });
  }
  locks.sort((a, b) => a.start - b.start);
  const elements: TimelineElement<ChevronRunElementId>[] = [
    {
      id: "race",
      lane: "Wall",
      label: "race",
      start: 0,
      length: LOCK_AT,
      beats: { blurCap: LOCK_AT + BLUR_CAP },
    },
    ...locks,
    {
      id: "fuse",
      lane: "Chevron",
      label: "fuse",
      start: FUSE_AT,
      length: FUSE,
      follows: columns > 0 ? "lock:0" : undefined,
      beats: { solidAt: SOLID_AT, settle: SETTLE, drift: DRIFT },
    },
    {
      id: "land",
      lane: "Figure",
      label: "figure",
      start: LAND_AT,
      length: LAND,
      follows: "fuse",
    },
    {
      id: "caption",
      lane: "Figure",
      label: "caption",
      start: LAND_AT + CAPTION_AT,
      length: CAPTION,
      follows: "land",
    },
  ];
  return elements;
});
