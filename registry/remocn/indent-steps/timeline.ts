import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line rising in and snapping one tab further in than the line before,
// then the light coming up once the last one has landed. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.
//
// The optional exit is pinned to the end of the clip, outside the scene's
// own timeline, so it is not an element here.

export type IndentStepsElementId = `line:${number}` | "light";

export interface IndentStepsTimingProps {
  lines?: string[];
  /** Frames between lines; long lists tighten it so every line lands. */
  stagger?: number;
}

export const DEFAULT_LINES = [
  "Write it in React.",
  "Render it in Remotion.",
  "Ship it tonight.",
];
const STAGGER = 20;
const FIRST = 4;
/** A row rises over `RISE`; a wrapped row `WRAP` after the one above. */
const RISE = 16;
const WRAP = 2;
/** A line snaps to its tab over `SNAP`. */
const SNAP = 8;
const LIGHT_LEAD = 4;
const LIGHT = 22;

/** The lines the scene shows: up to five. */
export function shownLines(lines: string[]) {
  return lines.slice(0, 5);
}

// A line starts when it rises; `tab` is when it snaps one tab in.
export const indentStepsTimeline = defineTimeline<
  IndentStepsElementId,
  IndentStepsTimingProps
>(({ lines = DEFAULT_LINES, stagger = STAGGER }) => {
  const logical = shownLines(lines);
  const n = Math.max(1, logical.length);
  const beat = n > 1 ? Math.min(stagger, 60 / (n - 1)) : stagger;
  const enter = (i: number) => FIRST + i * beat;
  const tabAfter = Math.min(10, beat * 0.5);
  const done = n > 1 ? enter(n - 1) + tabAfter + SNAP : enter(0) + RISE;
  const elements: TimelineElement<IndentStepsElementId>[] = logical.map(
    (line, i) => ({
      id: `line:${i}`,
      lane: "Lines",
      label: line,
      start: enter(i),
      length: i > 0 ? tabAfter + SNAP : RISE,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { tab: tabAfter, snap: SNAP, rise: RISE, wrap: WRAP },
    }),
  );
  elements.push({
    id: "light",
    lane: "Light",
    label: "light",
    start: done - LIGHT_LEAD,
    length: LIGHT,
    follows: logical.length > 0 ? `line:${logical.length - 1}` : undefined,
  });
  return elements;
});
