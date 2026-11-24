import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word pushing in from below and shoving the stack up, the last one
// landing in serif under a silk sheen. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type WordStackElementId = `word:${number}`;

export interface WordStackTimingProps {
  words?: string[];
  /** Frames between one word and the next. */
  beat?: number;
}

export const DEFAULT_WORDS = [
  "Even",
  "solo",
  "builders",
  "deserve",
  "cinematic",
  "launches",
];
/** Negative: the first word is already mid-push on frame 0. */
const START = -5;
export const INTERVAL = 17;
/** A push takes `PUSH`; the last one lands a little softer. */
const PUSH = 15;
const LAST_PUSH = 4;
/** The sheen eases across the last word for this long after it pushes in. */
const SHEEN = 70;

/** The words, or the logo word when there are none. */
export function wordsOf(words: string[]) {
  return words.length > 0 ? words : ["remocn"];
}

// A word runs until the next one pushes in.
export const wordStackTimeline = defineTimeline<
  WordStackElementId,
  WordStackTimingProps
>(({ words = DEFAULT_WORDS, beat = INTERVAL }) => {
  const list = wordsOf(words);
  const n = list.length;
  return list.map(
    (word, k): TimelineElement<WordStackElementId> => ({
      id: `word:${k}`,
      lane: "Words",
      label: word,
      start: START + k * beat,
      length: k === n - 1 ? PUSH + LAST_PUSH : beat,
      follows: k > 0 ? `word:${k - 1}` : undefined,
      beats:
        k === n - 1 ? { push: PUSH + LAST_PUSH, sheen: SHEEN } : { push: PUSH },
    }),
  );
});
