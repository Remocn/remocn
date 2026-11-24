import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each morph of the letters into the next phrase. Frames on the 30 fps scene
// timeline, after `speed`. With `loop`, the schedule is one turn of the loop:
// the first phrase is readable from the start and the last morph returns to
// it, and the turn repeats. The ids are public: a saved `timing` prop refers
// to them.

export type KineticMorphTextElementId = `phrase:${number}`;

export interface KineticMorphTextTimingProps {
  text?: string;
  transitionFrames?: number;
  holdFrames?: number;
  loop?: boolean;
}

export const DEFAULT_TEXT = "Hello | Make it move | Shape what's next";
export const TRANSITION = 54;
export const HOLD = 42;

export const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

/** The phrases of `text`: one per line, or separated by `|`. */
export function splitPhrases(text: string): string[] {
  return text
    .split(/[|\n\r]+/)
    .map((phrase) => phrase.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/** One morph: into phrase `to`, from `start` for `length` frames. */
export interface KineticMorphSpan {
  to: number;
  start: number;
  length: number;
}

/**
 * The morphs of `count` phrases in order. Without `loop` the first phrase
 * morphs in from nothing; with it the first phrase starts readable and the
 * last morph returns to it. Each morph waits `hold` after the one before.
 */
export function morphSpans(
  count: number,
  transitionFrames = TRANSITION,
  holdFrames = HOLD,
  loop = false,
): KineticMorphSpan[] {
  const transition = Math.max(1, finite(transitionFrames, TRANSITION));
  const hold = Math.max(0, finite(holdFrames, HOLD));
  const cycle = transition + hold;
  if (count === 0) return [];
  if (!loop) {
    return Array.from({ length: count }, (_, k) => ({
      to: k,
      start: k === 0 ? 0 : transition + (k - 1) * cycle + hold,
      length: transition,
    }));
  }
  if (count === 1) return [];
  return Array.from({ length: count }, (_, k) => ({
    to: (k + 1) % count,
    start: k * cycle + hold,
    length: transition,
  }));
}

// `phrase:<k>` is the morph into phrase `k`; the morphs form a chain. In a
// loop the morph back into the first phrase is the last element.
export const kineticMorphTextTimeline = defineTimeline<
  KineticMorphTextElementId,
  KineticMorphTextTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    transitionFrames = TRANSITION,
    holdFrames = HOLD,
    loop = false,
  }) => {
    const phrases = splitPhrases(text);
    return morphSpans(phrases.length, transitionFrames, holdFrames, loop).map(
      (span, i, all): TimelineElement<KineticMorphTextElementId> => ({
        id: `phrase:${span.to}`,
        lane: "Phrases",
        label: phrases[span.to],
        start: span.start,
        length: span.length,
        follows: i > 0 ? `phrase:${all[i - 1].to}` : undefined,
      }),
    );
  },
);
