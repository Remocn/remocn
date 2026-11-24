import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The wall of text fading in, then the label and each summary line opening
// above it in turn, and the push that drops the wall to a sliver at the end.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type TldrOnTopElementId = "wall" | "label" | `line:${number}` | "push";

export interface TldrOnTopTimingProps {
  lines?: string[];
  read?: number;
}

export const DEFAULT_LINES = [
  "Every scene is a component.",
  "Your brand is one file.",
  "It renders on your laptop.",
];

const WALL_IN = 16;
const OPEN = 18;
/** A block's content fades in this long after its slot starts opening. */
const REVEAL = 8;
/** The push starts this long before the last block has opened. */
const PUSH_LEAD = -4;
const PUSH = 26;

/** The summary lines; an empty list falls back to the defaults. */
export function linesOf(lines: string[]) {
  return lines.length > 0 ? lines : DEFAULT_LINES;
}

// `label` and each `line:<i>` open their slot over their length and fade
// their content in `reveal` frames later; they form a chain, spaced so the
// last one leaves room in the scene. `push` follows the last line.
export const tldrOnTopTimeline = defineTimeline<
  TldrOnTopElementId,
  TldrOnTopTimingProps
>(({ lines = DEFAULT_LINES, read = 34 }, { length }) => {
  const list = linesOf(lines);
  const span = length;
  const READ = read;
  const STEP = Math.min(30, Math.max(18, (span - READ - 110) / list.length));
  const insertAt = (k: number) => READ + k * STEP;
  const last = list.length;
  const elements: TimelineElement<TldrOnTopElementId>[] = [
    { id: "wall", lane: "Wall", label: "wall", start: 0, length: WALL_IN },
    {
      id: "label",
      lane: "Summary",
      label: "label",
      start: insertAt(0),
      length: OPEN,
      beats: { reveal: REVEAL },
    },
    ...list.map(
      (line, i): TimelineElement<TldrOnTopElementId> => ({
        id: `line:${i}`,
        lane: "Summary",
        label: line,
        start: insertAt(i + 1),
        length: OPEN,
        follows: i > 0 ? `line:${i - 1}` : "label",
        beats: { reveal: REVEAL },
      }),
    ),
    {
      id: "push",
      lane: "Wall",
      label: "push",
      start: insertAt(last) + OPEN + PUSH_LEAD,
      length: PUSH,
      follows: last > 0 ? `line:${last - 1}` : "label",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
