import { defineTimeline } from "@/lib/remocn/timeline";

// When each word drifts down and settles on the line, left to right. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type FeatherSettleElementId = `word:${number}`;

export interface FeatherSettleTimingProps {
  text?: string;
  stagger?: number;
  fall?: number;
}

export const DEFAULT_TEXT = "Your launch, landing softly.";
const FIRST = 4;
const STAGGER = 13;
const FALL = 68;

/** The words of the line, split on any whitespace. */
export function wordsOf(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

// A word falls over its whole length; each follows the one before it.
export const featherSettleTimeline = defineTimeline<
  FeatherSettleElementId,
  FeatherSettleTimingProps
>(({ text = DEFAULT_TEXT, stagger = STAGGER, fall = FALL }) =>
  wordsOf(text).map((word, i) => ({
    id: `word:${i}`,
    lane: "Words",
    label: word,
    start: FIRST + i * stagger,
    length: fall,
    follows: i > 0 ? `word:${i - 1}` : undefined,
  })),
);
