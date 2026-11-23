import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter drops in. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type TopDownLettersElementId = `char:${number}`;

export interface TopDownLettersTimingProps {
  text: string;
  staggerDelay?: number;
}

const STAGGER = 3;
/** Frames a letter takes to fade in; it travels for the first `travel`. */
const FADE = 12;
const TRAVEL = 7;

export const topDownLettersTimeline = defineTimeline<
  TopDownLettersElementId,
  TopDownLettersTimingProps
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
