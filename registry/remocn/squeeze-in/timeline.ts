import { defineTimeline } from "@/lib/remocn/timeline";

// The wipe that uncovers the letters, then the squeeze that closes their
// gaps. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.
//
// The wipe runs one straight line across the word, so it is one element
// rather than one per letter.

export type SqueezeInElementId = "reveal" | "squeeze";

export interface SqueezeInTimingProps {
  text: string;
  stagger?: number;
}

export const STAGGER = 3;
export const SQUEEZE_FRAMES = 16;

export const squeezeInTimeline = defineTimeline<
  SqueezeInElementId,
  SqueezeInTimingProps
>(({ text, stagger = STAGGER }) => {
  const lastRevealAt = Array.from(text).length * stagger;
  return [
    {
      id: "reveal",
      lane: "Reveal",
      label: text,
      start: 0,
      length: lastRevealAt,
    },
    {
      id: "squeeze",
      lane: "Squeeze",
      label: "squeeze",
      start: lastRevealAt,
      length: SQUEEZE_FRAMES,
      follows: "reveal",
    },
  ];
});
