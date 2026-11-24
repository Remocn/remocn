import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The haze lifting, the fixed lines and the first word rising and locking to
// one width on a spring, then each next word swapping in: the word before
// squeezes out and the new one rises and locks. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type WidthLockElementId =
  | "haze"
  | "before"
  | `word:${number}`
  | "after"
  | `leave:${number}`;

export interface WidthLockTimingProps {
  before?: string;
  words?: string[];
  after?: string;
  hold?: number;
}

export const DEFAULT_BEFORE = "Ship the";
export const DEFAULT_WORDS = [
  "trailer",
  "transitions",
  "captions",
  "launch video",
];
export const DEFAULT_AFTER = "by tonight.";

const HAZE = 30;
const RISE = 18;
const FIRST_AT = 3;
const AFTER_AT = 6;
const LOCK_AT = 18;
/** Each row locks this much later than the row above. */
const ROW_LAG = 3;
const FIRST_SWAP = 46;
const MIN_STEP = 16;
const OUT = 7;
const IN_AT = 6;
const IN = 10;
const SWAP_LOCK = 13;

/** The swapping words: the given ones, or a single default when empty. */
export function wordsOf(words: string[]) {
  return words.length > 0 ? words : ["launch video"];
}

// `haze` lifts the background glow. `before`, `word:0` and `after` rise over
// their length and lock to the shared width from their `lock` beat, each row
// a little later. `leave:<k>` squeezes word `k` out; `word:<k>` (from 1)
// rises in after it and locks from its `lock` beat. Leaves and words form a
// chain, each following the one before.
export const widthLockTimeline = defineTimeline<
  WidthLockElementId,
  WidthLockTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    words = DEFAULT_WORDS,
    after = DEFAULT_AFTER,
    hold = 30,
  }) => {
    const list = wordsOf(words);
    const STEP = Math.max(MIN_STEP, hold);
    const swapAt = (k: number) => FIRST_SWAP + (k - 1) * STEP;
    const wordRow = before ? 1 : 0;
    const elements: TimelineElement<WidthLockElementId>[] = [
      { id: "haze", lane: "Haze", label: "haze", start: 0, length: HAZE },
    ];
    if (before) {
      elements.push({
        id: "before",
        lane: "Before",
        label: before,
        start: 0,
        length: RISE,
        beats: { lock: LOCK_AT },
      });
    }
    list.forEach((w, k) => {
      if (k > 0) {
        elements.push({
          id: `leave:${k - 1}`,
          lane: "Words",
          label: `${list[k - 1]} out`,
          start: swapAt(k),
          length: OUT,
          follows: `word:${k - 1}`,
        });
      }
      const enterAt = k === 0 ? FIRST_AT : swapAt(k) + IN_AT;
      const lockAt =
        k === 0 ? LOCK_AT + wordRow * ROW_LAG : swapAt(k) + SWAP_LOCK;
      elements.push({
        id: `word:${k}`,
        lane: "Words",
        label: w,
        start: enterAt,
        length: k === 0 ? RISE : IN,
        follows: k > 0 ? `leave:${k - 1}` : undefined,
        beats: { lock: lockAt - enterAt },
      });
    });
    if (after) {
      elements.push({
        id: "after",
        lane: "After",
        label: after,
        start: AFTER_AT,
        length: RISE,
        beats: { lock: LOCK_AT + (wordRow + 1) * ROW_LAG - AFTER_AT },
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
