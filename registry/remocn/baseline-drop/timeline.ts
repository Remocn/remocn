import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The baseline drawing in, each word falling onto it, and the line
// retracting once the last word has landed. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type BaselineDropElementId = "draw" | `word:${number}` | "retract";

export interface BaselineDropTimingProps {
  text?: string;
  words?: string[];
  stagger?: number;
  fall?: number;
  hold?: number;
}

export const DEFAULT_TEXT = "Ship the story.";
export const STAGGER = 11;
export const FALL = 15;
export const RETRACT_AFTER = 20;
const DRAW_AT = 4;
const DRAW_LEN = 24;
const FIRST_LAND = 30;
const RETRACT_LEN = 22;
/** The ground keeps glowing up until this long after the retract starts. */
const GLOW_TAIL = 60;

export function wordsOf(text: string, words?: string[]) {
  return words ?? text.trim().split(/\s+/);
}

// A word's element is its fall: it lands at the element's end.
export const baselineDropTimeline = defineTimeline<
  BaselineDropElementId,
  BaselineDropTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    words: wordsProp,
    stagger = STAGGER,
    fall = FALL,
    hold = RETRACT_AFTER,
  }) => {
    const words = wordsOf(text, wordsProp);
    const land = (k: number) => FIRST_LAND + k * stagger;
    const elements: TimelineElement<BaselineDropElementId>[] = [
      {
        id: "draw",
        lane: "Baseline",
        label: "draw",
        start: DRAW_AT,
        length: DRAW_LEN,
      },
      ...words.map(
        (word, k): TimelineElement<BaselineDropElementId> => ({
          id: `word:${k}`,
          lane: "Words",
          label: word,
          start: land(k) - fall,
          length: fall,
          follows: k > 0 ? `word:${k - 1}` : "draw",
        }),
      ),
      {
        id: "retract",
        lane: "Baseline",
        label: "retract",
        start: land(words.length - 1) + hold,
        length: RETRACT_LEN,
        follows: words.length > 0 ? `word:${words.length - 1}` : "draw",
        beats: { glow: GLOW_TAIL },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
