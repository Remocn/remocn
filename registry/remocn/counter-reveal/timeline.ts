import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word's letters rising one by one, a slow push, then the plate lifting
// away to uncover the line behind its counters. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type CounterRevealElementId = `char:${number}` | "push" | "lift";

export interface CounterRevealTimingProps {
  word?: string;
  stagger?: number;
  liftAt?: number;
}

export const DEFAULT_WORD = "Beta";
/** Negative: the first letter is already mid-rise on frame 0. */
const ENTER = -6;
const ENTER_LEN = 20;
const STAGGER = 3;
export const EXIT = 66;
export const EXIT_LEN = 26;
/** The line shrinks from `SHRINK_AT` into the lift to `SHRINK_TAIL` past it. */
const SHRINK_AT = -6;
const SHRINK_TAIL = 4;
/** The line settles over `SETTLE` after the lift. */
const SETTLE = 36;

// The push runs from the word's rise to the lift.
export const counterRevealTimeline = defineTimeline<
  CounterRevealElementId,
  CounterRevealTimingProps
>(({ word = DEFAULT_WORD, stagger = STAGGER, liftAt = EXIT }) => {
  const chars = Array.from(word);
  const elements: TimelineElement<CounterRevealElementId>[] = chars.map(
    (ch, i) => ({
      id: `char:${i}`,
      lane: "Letters",
      label: ch,
      start: ENTER + i * stagger,
      length: ENTER_LEN,
      follows: i > 0 ? `char:${i - 1}` : undefined,
    }),
  );
  elements.push(
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: ENTER_LEN,
      length: liftAt - ENTER_LEN,
    },
    {
      id: "lift",
      lane: "Plate",
      label: "lift",
      start: liftAt,
      length: EXIT_LEN,
      follows: "push",
      beats: { shrinkAt: SHRINK_AT, shrinkTail: SHRINK_TAIL, settle: SETTLE },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
