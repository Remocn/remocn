import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line's block growing in, each next line arriving on a beat and
// squeezing the others, the blocks locking into balance on a spring, and the
// field's light drifting across the shot. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type WrappedSquashElementId =
  | "drift"
  | "intro"
  | `line:${number}`
  | "lock";

export interface WrappedSquashTimingProps {
  lines?: string[];
  /** Frames between one line arriving and the next. */
  beat?: number;
}

export const DEFAULT_LINES = ["YOU", "SHIPPED", "A LOT"];
export const DEFAULT_BEAT = 26;

const INTRO = 16;
const ARRIVE = 14;
/** The lock spring has settled after about this long. */
const LOCK = 15;
const DRIFT = 150;

/** Up to three lines, set in caps, empty ones dropped. */
export function rowsOf(lines: string[]) {
  return lines
    .slice(0, 3)
    .map((l) => l.toUpperCase().replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// `drift` turns the field and moves its light over its length. `intro` grows
// the first line's block in. `line:<i>` (from 1) brings line `i` in, each
// following the one before. `lock` springs the blocks into balance from its
// start, following the last line.
export const wrappedSquashTimeline = defineTimeline<
  WrappedSquashElementId,
  WrappedSquashTimingProps
>(({ lines = DEFAULT_LINES, beat = DEFAULT_BEAT }) => {
  const rows = rowsOf(lines);
  const n = Math.max(1, rows.length);
  const BEATS = [beat, beat * 2].slice(0, n - 1);
  const lockAt = beat + beat * (n - 1);
  const elements: TimelineElement<WrappedSquashElementId>[] = [
    { id: "drift", lane: "Field", label: "drift", start: 0, length: DRIFT },
    {
      id: "intro",
      lane: "Lines",
      label: rows[0] ?? "",
      start: 0,
      length: INTRO,
    },
    ...BEATS.map(
      (at, k): TimelineElement<WrappedSquashElementId> => ({
        id: `line:${k + 1}`,
        lane: "Lines",
        label: rows[k + 1] ?? "",
        start: at,
        length: ARRIVE,
        follows: k > 0 ? `line:${k}` : undefined,
      }),
    ),
    {
      id: "lock",
      lane: "Lines",
      label: "lock",
      start: lockAt,
      length: LOCK,
      follows: BEATS.length > 0 ? `line:${BEATS.length}` : undefined,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
