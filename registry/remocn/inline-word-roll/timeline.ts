import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When the slot rolls from one word to the next, the pauses between rolls
// shrinking as it speeds up. Frames on the 30 fps scene timeline. The ids are
// public: a saved `timing` prop refers to them.

export type InlineWordRollElementId = `roll:${number}`;

export interface InlineWordRollTimingProps {
  text?: string;
  interval?: number;
  acceleration?: number;
  transitionFrames?: number;
}

export const DEFAULT_TEXT =
  "leads | customers | subscribers | appointments | demos | quotes | registrants | trials | conversions";
const INTERVAL = 12;
const ACCELERATION = 0.9;
const TRANSITION_FRAMES = 6;

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

/** The words, split on | or newlines. */
export const parseWords = (text: string) =>
  text
    .split(/[|\n\r]+/)
    .map((word) => word.trim())
    .filter(Boolean);

/**
 * The rolls for `count` words. `roll:<k>` rolls onto word `k` and takes the
 * transition; the wait before it shrinks by `acceleration` each time.
 */
export function rollElements(
  count: number,
  interval = INTERVAL,
  acceleration = ACCELERATION,
  transitionFrames = TRANSITION_FRAMES,
  words: string[] = [],
): TimelineElement<InlineWordRollElementId>[] {
  const transition = Math.max(1, finite(transitionFrames, TRANSITION_FRAMES));
  const gap = Math.max(transition, finite(interval, INTERVAL));
  const rate = Math.min(1, Math.max(0.5, finite(acceleration, ACCELERATION)));
  const elements: TimelineElement<InlineWordRollElementId>[] = [];
  let start = 0;
  for (let index = 1; index < count; index++) {
    start += Math.max(transition, gap * rate ** (index - 1));
    elements.push({
      id: `roll:${index}`,
      lane: "Rolls",
      label: words[index] ?? `word ${index}`,
      start,
      length: transition,
      follows: index > 1 ? `roll:${index - 1}` : undefined,
    });
  }
  return elements;
}

// Each roll follows the one before it.
export const inlineWordRollTimeline = defineTimeline<
  InlineWordRollElementId,
  InlineWordRollTimingProps
>(({ text = DEFAULT_TEXT, interval, acceleration, transitionFrames }) => {
  const words = parseWords(text);
  return rollElements(
    words.length,
    interval,
    acceleration,
    transitionFrames,
    words,
  );
});
