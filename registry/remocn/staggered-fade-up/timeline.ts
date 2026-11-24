import { defineTimeline } from "@/lib/remocn/timeline";

// When each word rises in. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type StaggeredFadeUpElementId = `word:${number}`;

export interface StaggeredFadeUpTimingProps {
  text: string;
  staggerDelay?: number;
}

const STAGGER_DELAY = 4;
/** Frames a word takes to fade in and slide up. */
const RISE = 12;

export const staggeredFadeUpTimeline = defineTimeline<
  StaggeredFadeUpElementId,
  StaggeredFadeUpTimingProps
>(({ text, staggerDelay = STAGGER_DELAY }) =>
  text.split(" ").map((word, i) => ({
    id: `word:${i}`,
    lane: "Words",
    label: word,
    start: i * staggerDelay,
    length: RISE,
    follows: i > 0 ? `word:${i - 1}` : undefined,
  })),
);
