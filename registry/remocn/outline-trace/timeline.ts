import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each letter tracing its outer contours, then its counters, then filling
// from the bottom up. Frames on the 30 fps scene timeline, after `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type OutlineTraceElementId = `letter:${number}`;

export interface OutlineTraceTimingProps {
  text?: string;
  stagger?: number;
}

export const DEFAULT_TEXT = "Outline";
export const DEFAULT_STAGGER = 3;

/** Per-letter beats on the 30 fps clock, relative to the letter's start. */
export const TRACE_BEATS = {
  outer: [0, 18],
  counter: [4, 18],
  fill: [14, 26],
} as const;

export function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// `letter:<i>` is the character at index `i` of `text`, spaces included;
// the letters are a chain. It lasts until it has filled. Its beats, from its
// start: `outer` (the outer contours finish), `counter` and `counterEnd`
// (the counters trace) and `fill` (the fill starts rising).
export const outlineTraceTimeline = defineTimeline<
  OutlineTraceElementId,
  OutlineTraceTimingProps
>(({ text = DEFAULT_TEXT, stagger = DEFAULT_STAGGER }) => {
  const step = Math.max(0, finite(stagger, 3));
  const { outer, counter, fill } = TRACE_BEATS;
  return Array.from(text).map(
    (char, i): TimelineElement<OutlineTraceElementId> => ({
      id: `letter:${i}`,
      lane: "Letters",
      label: char,
      start: i * step,
      length: fill[1],
      follows: i > 0 ? `letter:${i - 1}` : undefined,
      beats: {
        outer: outer[1],
        counter: counter[0],
        counterEnd: counter[1],
        fill: fill[0],
      },
    }),
  );
});
