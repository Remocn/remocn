import { defineTimeline } from "@/lib/remocn/timeline";

// When each phrase of the stream arrives and when it runs out. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type WordStreamElementId = `phrase:${number}`;

export interface WordStreamTimingProps {
  text: string;
  wordGap?: number;
  hold?: number;
}

export interface PhraseSchedule {
  words: string[];
  start: number;
  exitStart: number;
  last: boolean;
}

export const WORD_GAP = 6;
export const HOLD = 18;
export const REVEAL_FRAMES = 3;
const ENTRY_FRAMES = 8;
const RUN_OUT_FRAMES = 5;
const SWAP_OVERLAP = 0;

export function schedulePhrases(
  text: string,
  wordGap: number,
  hold: number,
): PhraseSchedule[] {
  const phrases = text
    .split("|")
    .map((phrase) => phrase.trim())
    .filter(Boolean);
  let cursor = 0;
  return phrases.map((phrase, i) => {
    const words = phrase.split(/\s+/);
    const start = cursor;
    const complete = start + (words.length - 1) * wordGap + REVEAL_FRAMES;
    const exitStart = complete + hold;
    cursor = exitStart + SWAP_OVERLAP;
    return { words, start, exitStart, last: i === phrases.length - 1 };
  });
}

// A phrase runs from its first word to the moment it runs out (the last
// one stops crawling there). Its words resolve `wordGap` apart.
export const wordStreamTimeline = defineTimeline<
  WordStreamElementId,
  WordStreamTimingProps
>(({ text, wordGap = WORD_GAP, hold = HOLD }) =>
  schedulePhrases(text, wordGap, hold).map((phrase, i) => ({
    id: `phrase:${i}`,
    lane: "Phrases",
    label: phrase.words.join(" "),
    start: phrase.start,
    length: phrase.exitStart - phrase.start,
    follows: i > 0 ? `phrase:${i - 1}` : undefined,
    beats: {
      wordGap,
      reveal: REVEAL_FRAMES,
      entry: ENTRY_FRAMES,
      runOut: RUN_OUT_FRAMES,
    },
  })),
);
