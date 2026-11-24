import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dot field drifts, then the dots fly into each word in turn, holding
// on each, and rest on the last. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type DotTypeElementId = `word:${number}`;

export interface DotTypeTimingProps {
  words?: string[];
  hold?: number;
}

export const DEFAULT_WORDS = ["Think.", "Make.", "Ship."];
export const HOLD = 22;
export const FINAL_HOLD = 32;
const FIELD = 14;
const FIRST = 32;
const STREAM = 34;

/** When the dots fly into each word: from the field, then word to word. */
export function windows(wordCount: number, hold = HOLD) {
  const out: { start: number; len: number }[] = [];
  let t = FIELD;
  for (let i = 0; i < wordCount; i++) {
    const len = i === 0 ? FIRST : STREAM;
    out.push({ start: t, len });
    t += len + hold;
  }
  return out;
}

/** The words shown: the defaults when the list is empty. */
export function wordsOf(words: string[]) {
  return words.length ? words : DEFAULT_WORDS;
}

// `word:<i>` is the flight into word `i`, the field drifting until the
// first; each follows the one before, `hold` frames after it lands. The
// camera push and the palette sweep run until `rest` frames after the last
// word lands.
export const dotTypeTimeline = defineTimeline<
  DotTypeElementId,
  DotTypeTimingProps
>(({ words = DEFAULT_WORDS, hold = HOLD }) => {
  const list = wordsOf(words);
  return windows(list.length, hold).map(
    (w, i): TimelineElement<DotTypeElementId> => ({
      id: `word:${i}`,
      lane: "Words",
      label: list[i],
      start: w.start,
      length: w.len,
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats: i === list.length - 1 ? { rest: FINAL_HOLD } : undefined,
    }),
  );
});
