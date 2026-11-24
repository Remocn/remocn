import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each line fades in and when it settles into the stack, center out.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type AbsorbStackElementId = `line:${number}`;

export interface AbsorbStackTimingProps {
  lines?: string[];
  /** Frames between rings of lines as they settle, center out. */
  stagger?: number;
}

export const DEFAULT_LINES = [
  "made to",
  "sink into",
  "your cut,",
  "not sit",
  "on top.",
];
export const RING_GAP = 5;
/** A line fades in over `ENTER_LEN`, its ring `ENTER_GAP` after the one inside. */
const ENTER_LEN = 12;
const ENTER_GAP = 3;
/** The center line starts settling this long after the scene starts. */
const SETTLE_AT = 14;

// A line's `settle` beat is when its spring starts, from the line's start.
export const absorbStackTimeline = defineTimeline<
  AbsorbStackElementId,
  AbsorbStackTimingProps
>(({ lines = DEFAULT_LINES, stagger = RING_GAP }) => {
  const mid = (Math.max(1, lines.length) - 1) / 2;
  const order = lines
    .map((line, i) => ({ line, i, ring: Math.abs(i - mid) }))
    .sort((a, b) => a.ring - b.ring);
  return order.map(
    ({ line, i, ring }, k): TimelineElement<AbsorbStackElementId> => ({
      id: `line:${i}`,
      lane: "Lines",
      label: line,
      start: ring * ENTER_GAP,
      length: ENTER_LEN,
      follows: k > 0 ? `line:${order[k - 1].i}` : undefined,
      beats: { settle: SETTLE_AT + ring * stagger - ring * ENTER_GAP },
    }),
  );
});
