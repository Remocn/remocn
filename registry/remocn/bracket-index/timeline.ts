import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The brackets draw in beside the prefix, open on the first word, roll
// through the words like an odometer and close on the product name, which
// lands bigger. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BracketIndexElementId = "intro" | `word:${number}` | "product";

export interface BracketIndexTimingProps {
  words?: string[];
  product?: string;
  hold?: number;
}

export const DEFAULT_WORDS = ["launches", "changelogs", "demos"];
export const DEFAULT_PRODUCT = "remocn";
const INTRO = 10;
const RISE = 12;
const OPEN_AT = 6;
const OPEN_LEN = 16;
const HOLD = 22;
const SWAP = 16;
const ROLL = 8;
const RESIZE = 8;
const FINAL_SWAP = 20;
/** The counter's first index fades in this far into the opening, over 10. */
const COUNTER_AT = 8;
const COUNTER = 10;
/** A later index rolls in this far into its swap, over `COUNTER`. */
const INDEX_AT = 2;
/** The outgoing index rolls out over this many frames. */
const INDEX_OUT = 8;

// A word runs until the next one rolls in. A wider word rolls in once the
// brackets have made room for it (`rollWait`); a narrower one rolls in at
// once and the brackets close on it after (`resizeWait`).
export const bracketIndexTimeline = defineTimeline<
  BracketIndexElementId,
  BracketIndexTimingProps
>(({ words = DEFAULT_WORDS, product = DEFAULT_PRODUCT, hold = HOLD }) => {
  const items = [...words, product];
  const last = items.length - 1;
  const starts = [OPEN_AT];
  for (let i = 1; i < items.length; i++) {
    starts.push(starts[i - 1] + (i === 1 ? OPEN_LEN : SWAP) + hold);
  }
  const swapBeats = {
    roll: ROLL,
    resize: RESIZE,
    rollWait: RESIZE - 2,
    resizeWait: ROLL - 1,
    indexAt: INDEX_AT,
    index: COUNTER,
    indexOut: INDEX_OUT,
  };
  const elements: TimelineElement<BracketIndexElementId>[] = [
    {
      id: "intro",
      lane: "Brackets",
      label: "brackets",
      start: 0,
      length: INTRO,
      beats: { rise: RISE },
    },
  ];
  items.forEach((word, i) => {
    elements.push({
      id: i === last ? "product" : `word:${i}`,
      lane: "Words",
      label: word,
      start: starts[i],
      length: i === last ? FINAL_SWAP : starts[i + 1] - starts[i],
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats:
        i === 0
          ? {
              open: OPEN_LEN,
              counterAt: COUNTER_AT,
              counter: COUNTER,
            }
          : swapBeats,
    });
  });
  return elements;
});
