import { defineTimeline } from "@/lib/remocn/timeline";

// When each word springs in. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type SpringScaleInElementId = `word:${number}`;

export interface SpringScaleInTimingProps {
  text: string;
  staggerDelay?: number;
}

const STAGGER = 3;
/** Frames a word takes to come in. */
const LENGTH = 11;

export const springScaleInTimeline = defineTimeline<
  SpringScaleInElementId,
  SpringScaleInTimingProps
>(({ text, staggerDelay = STAGGER }) =>
  text.split(" ").map((item, i) => ({
    id: `word:${i}`,
    lane: "Words",
    label: item,
    start: i * staggerDelay,
    length: LENGTH,
    follows: i > 0 ? `word:${i - 1}` : undefined,
  })),
);
