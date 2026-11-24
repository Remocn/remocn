import { defineTimeline } from "@/lib/remocn/timeline";

// When each word drops in above the line, pushing the words before it down.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type ShortSlideDownElementId = `word:${number}`;

export interface ShortSlideDownTimingProps {
  text: string;
}

/** The first word settles in `FIRST`; each later word pushes in `PUSH`. */
const FIRST = 11;
const PUSH = 15;
/** A word travels into place over its first `TRAVEL` frames. */
const TRAVEL = 8;

// `word:<j>` is word j's entry and, for the words before it, the push down.
export const shortSlideDownTimeline = defineTimeline<
  ShortSlideDownElementId,
  ShortSlideDownTimingProps
>(({ text }) =>
  text.split(" ").map((word, j) => ({
    id: `word:${j}`,
    lane: "Words",
    label: word,
    start: j === 0 ? 0 : FIRST + (j - 1) * PUSH,
    length: j === 0 ? FIRST : PUSH,
    follows: j > 0 ? `word:${j - 1}` : undefined,
    beats: { travel: TRAVEL },
  })),
);
