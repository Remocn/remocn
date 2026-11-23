import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line settling in, then an object passing in front of the line,
// swapping it for the next behind its center line, once per line after the
// first. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type PassSwapElementId = "intro" | `pass:${number}`;

export interface PassSwapTimingProps {
  lines?: string[];
  passLength?: number;
  passGap?: number;
}

export const DEFAULT_LINES = [
  "Copy the code.",
  "Own every frame.",
  "Ship the film.",
];
export const FIRST_PASS = 30;
export const PASS_LEN = 30;
export const PASS_GAP = 46;
const INTRO = 22;
/** The new line settles this long after the object has passed. */
const SETTLE = 16;

/** The lines, or one empty line when there are none. */
export function linesOf(lines: string[]) {
  return lines.length > 0 ? lines : [""];
}

// `pass:<i>` swaps line i for line i + 1.
export const passSwapTimeline = defineTimeline<
  PassSwapElementId,
  PassSwapTimingProps
>(({ lines = DEFAULT_LINES, passLength = PASS_LEN, passGap = PASS_GAP }) => {
  const safe = linesOf(lines);
  const passes = Math.max(0, safe.length - 1);
  const elements: TimelineElement<PassSwapElementId>[] = [
    { id: "intro", lane: "Line", label: safe[0], start: 0, length: INTRO },
  ];
  for (let i = 0; i < passes; i++) {
    elements.push({
      id: `pass:${i}`,
      lane: "Passes",
      label: safe[i + 1],
      start: FIRST_PASS + i * passGap,
      length: passLength,
      follows: i > 0 ? `pass:${i - 1}` : "intro",
      beats: { settle: SETTLE },
    });
  }
  return elements;
});
