import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter rises in. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BottomUpLettersElementId = `char:${number}`;

export interface BottomUpLettersTimingProps {
  text: string;
  staggerDelay?: number;
}

const STAGGER = 3;
/** Frames a letter takes to fade in; it travels for the first `travel`. */
const FADE = 12;
const TRAVEL = 7;

export const bottomUpLettersTimeline = defineTimeline<
  BottomUpLettersElementId,
  BottomUpLettersTimingProps
>(({ text, staggerDelay = STAGGER }) =>
  Array.from(text).map((char, i) => ({
    id: `char:${i}`,
    lane: "Letters",
    label: char,
    start: i * staggerDelay,
    length: FADE,
    follows: i > 0 ? `char:${i - 1}` : undefined,
    beats: { travel: TRAVEL },
  })),
);
