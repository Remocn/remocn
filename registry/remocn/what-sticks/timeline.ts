import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line of the column rising in, each moment (the slug above the column
// that turns over as lines are forgotten), and the kept line glowing at the
// end. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type WhatSticksElementId =
  | `line:${number}`
  | `moment:${number}`
  | "keep";

export interface WhatSticksTimingProps {
  lines?: string[];
  moments?: string[];
  stagger?: number;
}

export const DEFAULT_LINES = [
  "Scenes install with one command.",
  "Every word on screen is a prop.",
  "Transitions land on the beat.",
  "Captions come from the transcript.",
  "You own every file.",
  "It renders on your laptop.",
];

export const DEFAULT_MOMENTS = [
  "Tonight, you’ll remember all of it.",
  "Tomorrow, about half.",
  "Next week, just this.",
];

/** The lines drawn: the list, or the defaults when it is empty. */
export const linesOf = (lines: string[]) =>
  lines.length > 0 ? lines : DEFAULT_LINES;
/** The moments drawn: the list, or the defaults when it is empty. */
export const momentsOf = (moments: string[]) =>
  moments.length > 0 ? moments : DEFAULT_MOMENTS;

export const STAGGER = 5;
const LINE_AT = 10;
const LINE_LEN = 18;
const FIRST_GAP = 30;
const MIN_GAP = 42;
const MAX_GAP = 90;
const TAIL = 100;
const GLOW_AT = 22;
const GLOW_LEN = 18;

// `length` is what the clip leaves after `delay`, times `speed`: the moments
// after the first spread over it. A moment lasts until the next one; its
// slug rises from `enter` over `in` frames and leaves over `out` once the
// next moment starts, and the last one tints from `tint` to `tintEnd`. The
// lines a moment forgets fade from `forget`, `forgetGap` apart, each over
// `fade` frames. The lines form a chain; the second moment follows the last
// line, each moment the one before, and the glow follows the last moment.
export const whatSticksTimeline = defineTimeline<
  WhatSticksElementId,
  WhatSticksTimingProps
>(
  (
    { lines = DEFAULT_LINES, moments = DEFAULT_MOMENTS, stagger = STAGGER },
    { length },
  ) => {
    const list = linesOf(lines);
    const steps = momentsOf(moments);
    const n = list.length;
    const stepCount = Math.max(1, steps.length);
    const enterOf = (i: number) => LINE_AT + i * stagger;
    const first = enterOf(n - 1) + LINE_LEN + FIRST_GAP;
    const gap =
      stepCount > 2
        ? Math.min(
            MAX_GAP,
            Math.max(MIN_GAP, (length - first - TAIL) / (stepCount - 2)),
          )
        : 0;
    const stepAt = (s: number) => first + (s - 1) * gap;
    const finalStep = stepCount - 1;
    const glowAt = stepAt(Math.max(1, finalStep)) + GLOW_AT;

    const elements: TimelineElement<WhatSticksElementId>[] = list.map(
      (line, i): TimelineElement<WhatSticksElementId> => ({
        id: `line:${i}`,
        lane: "Lines",
        label: line,
        start: enterOf(i),
        length: LINE_LEN,
        follows: i > 0 ? `line:${i - 1}` : undefined,
      }),
    );
    for (let s = 0; s < stepCount; s++) {
      const tin = s === 0 ? 0 : stepAt(s);
      const next = s + 1 < stepCount ? stepAt(s + 1) : undefined;
      elements.push({
        id: `moment:${s}`,
        lane: "Moments",
        label: steps[s] ?? "",
        start: tin,
        length: next === undefined ? GLOW_AT : next - tin,
        follows:
          s === 1 ? `line:${n - 1}` : s > 1 ? `moment:${s - 1}` : undefined,
        beats: {
          enter: s === 0 ? 0 : 6,
          in: 14,
          out: 5,
          tint: 6,
          tintEnd: 20,
          forget: 10,
          forgetGap: 5,
          fade: 20,
        },
      });
    }
    elements.push({
      id: "keep",
      lane: "Lines",
      label: "glow",
      start: glowAt,
      length: GLOW_LEN,
      follows: `moment:${stepCount - 1}`,
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
