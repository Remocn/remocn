import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line slides in and sharpens as one; its words fade in one after
// another. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type ShortSlideRightElementId = "slide" | `word:${number}`;

export interface ShortSlideRightTimingProps {
  text: string;
  staggerDelay?: number;
}

const STAGGER = 3;
/** The line sharpens over `SLIDE`, travelling for the first `TRAVEL`. */
const SLIDE = 16;
const TRAVEL = 8;
/** Frames a word takes to fade in. */
const WORD_FADE = 6;

export const shortSlideRightTimeline = defineTimeline<
  ShortSlideRightElementId,
  ShortSlideRightTimingProps
>(({ text, staggerDelay = STAGGER }) => [
  {
    id: "slide",
    lane: "Line",
    label: text,
    start: 0,
    length: SLIDE,
    beats: { travel: TRAVEL },
  },
  ...text.split(" ").map(
    (word, i): TimelineElement<ShortSlideRightElementId> => ({
      id: `word:${i}`,
      lane: "Words",
      label: word,
      start: i * staggerDelay,
      length: WORD_FADE,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    }),
  ),
]);
