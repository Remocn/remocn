import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each letter stops scrambling and locks to its own glyph. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type MatrixDecodeElementId = `char:${number}`;

export interface MatrixDecodeTimingProps {
  text: string;
  revealDuration?: number;
}

const REVEAL_DURATION = 60;

// `char:<i>` is the letter at index `i` of `text`; spaces never scramble, so
// they have no element. A letter scrambles until its start and locks there;
// its length is the slot until the next letter locks.
export const matrixDecodeTimeline = defineTimeline<
  MatrixDecodeElementId,
  MatrixDecodeTimingProps
>(({ text, revealDuration = REVEAL_DURATION }) => {
  const n = Math.max(text.length, 1);
  const elements: TimelineElement<MatrixDecodeElementId>[] = [];
  let prev: MatrixDecodeElementId | undefined;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") continue;
    const id: MatrixDecodeElementId = `char:${i}`;
    elements.push({
      id,
      lane: "Letters",
      label: text[i],
      start: (i / n) * revealDuration,
      length: revealDuration / n,
      follows: prev,
    });
    prev = id;
  }
  return elements;
});
