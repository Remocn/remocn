import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word (or newline-separated phrase) revealed through the shader, one
// after another; the last one stays. Frames on the 30 fps scene timeline.
// The ids are public: a saved `timing` prop refers to them.

export type ShaderTextRevealElementId = `word:${number}`;

export interface ShaderTextRevealTimingProps {
  text?: string;
  wordDuration?: number;
}

export const DEFAULT_TEXT = "Your product";
export const WORD_DURATION = 30;

/** The words shown: newline-separated phrases, or else single words. */
export function wordsOf(text: string) {
  const phrases = text.includes("\n") ? text.split("\n") : text.split(/\s+/);
  return phrases.map((word) => word.trim()).filter(Boolean);
}

/** Frames per word, rounded and at least 12. */
export const wordFrames = (wordDuration: number) =>
  Math.max(12, Math.round(wordDuration));

// `word:<i>` is word `i` entering, holding and clearing over its length; the
// last one stays once it has entered. The words form a chain.
export const shaderTextRevealTimeline = defineTimeline<
  ShaderTextRevealElementId,
  ShaderTextRevealTimingProps
>(({ text = DEFAULT_TEXT, wordDuration = WORD_DURATION }) => {
  const duration = wordFrames(wordDuration);
  return wordsOf(text).map(
    (word, i): TimelineElement<ShaderTextRevealElementId> => ({
      id: `word:${i}`,
      lane: "Words",
      label: word,
      start: i * duration,
      length: duration,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    }),
  );
});
