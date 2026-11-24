import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line's doors sliding in with the track, and each next line
// pushing the doors of the one before apart. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SlideDoorsElementId = "enter" | `line:${number}`;

export interface SlideDoorsTimingProps {
  lines?: string[];
  hold?: number;
}

export const DEFAULT_LINES = [
  "Scenes that move.",
  "Code you own.",
  "Arriving in your repo.",
];

/** The lines drawn: the list, or one line when it is empty. */
export const linesOf = (lines: string[]) =>
  lines.length > 0 ? lines : ["Arriving in your repo."];

export const HOLD = 28;
const ENTER = 20;
const CRACK = 8;
const PUSH = 16;
const CLEAR = 14;
const OPEN = CRACK + PUSH + CLEAR;

// Line `k` (from 1) arrives through the doors of line `k - 1`: they crack
// open over `crack` frames, the new line pushes through and grows over
// `push`, and the doors clear off for the rest. Each line follows the one
// before; the first follows the entry.
export const slideDoorsTimeline = defineTimeline<
  SlideDoorsElementId,
  SlideDoorsTimingProps
>(({ lines = DEFAULT_LINES, hold = HOLD }) => {
  const list = linesOf(lines);
  const STEP = CRACK + PUSH + Math.max(8, hold);
  const openAt = (k: number) => ENTER + Math.max(8, hold) + k * STEP;
  const elements: TimelineElement<SlideDoorsElementId>[] = [
    { id: "enter", lane: "Lines", label: list[0], start: 0, length: ENTER },
  ];
  for (let k = 1; k < list.length; k++) {
    elements.push({
      id: `line:${k}`,
      lane: "Lines",
      label: list[k],
      start: openAt(k - 1),
      length: OPEN,
      follows: k > 1 ? `line:${k - 1}` : "enter",
      beats: { crack: CRACK, push: PUSH },
    });
  }
  return elements;
});
