import { defineTimeline } from "@/lib/remocn/timeline";

// When each word arrives and pushes the line along. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type WordPushElementId = `word:${number}`;

export interface WordPushTimingProps {
  text: string;
  wordGap?: number;
  accel?: number;
}

export const WORD_GAP = 10;
export const ACCEL = 0.8;
/** A word fades in over `REVEAL_FRAMES` and slides into place over `SLIDE_FRAMES`. */
const REVEAL_FRAMES = 2;
export const SLIDE_FRAMES = 12;
/** The line starts making room for a word this many frames after it shows. */
const PUSH_AFTER = 1;

export function revealFrame(
  index: number,
  wordGap: number,
  accel: number,
): number {
  if (accel === 1) return index * wordGap;
  return (wordGap * (1 - accel ** index)) / (1 - accel);
}

export const wordPushTimeline = defineTimeline<
  WordPushElementId,
  WordPushTimingProps
>(({ text, wordGap = WORD_GAP, accel = ACCEL }) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, j) => ({
      id: `word:${j}`,
      lane: "Words",
      label: word,
      start: revealFrame(j, wordGap, accel),
      length: SLIDE_FRAMES,
      follows: j > 0 ? `word:${j - 1}` : undefined,
      beats: { reveal: REVEAL_FRAMES, push: PUSH_AFTER },
    })),
);
