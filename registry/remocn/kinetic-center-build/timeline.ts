import { defineTimeline } from "@/lib/remocn/timeline";

// When each word comes in at the right of the line, pushing the words
// before it left so the line stays centered. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type KineticCenterBuildElementId = `word:${number}`;

export interface KineticCenterBuildTimingProps {
  text: string;
}

/** Frames the first word takes to come in, alone in the center. */
const FIRST = 10;
/** Frames every later word takes, while it pushes the line left. */
const PUSH = 13;
/** Frames the slide itself takes, from the start of a word. */
const TRAVEL = 7;

/** The words of the line, split on spaces. */
export function wordsOf(text: string) {
  return text.split(" ");
}

// Each word follows the one before it; the earlier words slide left over
// the next word's travel beat and blur over its whole length.
export const kineticCenterBuildTimeline = defineTimeline<
  KineticCenterBuildElementId,
  KineticCenterBuildTimingProps
>(({ text }) =>
  wordsOf(text).map((word, j) => ({
    id: `word:${j}`,
    lane: "Words",
    label: word,
    start: j === 0 ? 0 : FIRST + (j - 1) * PUSH,
    length: j === 0 ? FIRST : PUSH,
    follows: j > 0 ? `word:${j - 1}` : undefined,
    beats: { travel: TRAVEL },
  })),
);
