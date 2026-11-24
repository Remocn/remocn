import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line rising in letter by letter, the second line rising under it,
// the swap (the first line draining small and muted while the second grows),
// and the second line filling with the accent. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type LessMoreElementId = "less" | "more" | "swap" | "fill";

export interface LessMoreTimingProps {
  less?: string;
  more?: string;
  swapAt?: number;
  fillAt?: number;
}

export const DEFAULT_LESS = "Less explaining.";
export const DEFAULT_MORE = "More showing.";

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 1.2;
const RISE_SPAN = 14;
const LINE_GAP = 6;
const DRAIN_AT = 34;
const DRAIN_SPREAD = 30;
const DRAIN_LEN = 18;
const GROW_DELAY = 3;
const FILL_AT = 80;
const FILL_SPREAD = 12;
const FILL_LEN = 12;

// A rising line's letters start `gap` apart and rise over `rise`. The second
// line can wrap into several rows; row `k` of it starts `(k - 1) * rowGap`
// after `more`. In the swap, letter `i` of the first line drains from
// `i * drainStep` over `drain`, and letter `j` of the second springs larger
// from `grow + j * growStep`. In the fill, letter `j` fills from `j * step`
// over `letter`. The lines form a chain; the fill follows the swap when it
// comes after it.
export const lessMoreTimeline = defineTimeline<
  LessMoreElementId,
  LessMoreTimingProps
>(
  ({
    less = DEFAULT_LESS,
    more = DEFAULT_MORE,
    swapAt = DRAIN_AT,
    fillAt = FILL_AT,
  }) => {
    const n1 = Array.from(less.trim()).length;
    const n2 = Array.from(more.trim()).length;
    const drainStep = n1 > 1 ? DRAIN_SPREAD / (n1 - 1) : 0;
    const growStep = n2 > 1 ? DRAIN_SPREAD / (n2 - 1) : 0;
    const riseGap = Math.min(RISE_GAP, RISE_SPAN / Math.max(1, n1, n2));
    const fillStep = n2 > 1 ? FILL_SPREAD / (n2 - 1) : 0;
    const elements: TimelineElement<LessMoreElementId>[] = [
      {
        id: "less",
        lane: "Lines",
        label: less.trim(),
        start: RISE_AT + 0 * LINE_GAP,
        length: Math.max(0, n1 - 1) * riseGap + RISE_LEN,
        beats: { gap: riseGap, rise: RISE_LEN },
      },
      {
        id: "more",
        lane: "Lines",
        label: more.trim(),
        start: RISE_AT + 1 * LINE_GAP,
        length: Math.max(0, n2 - 1) * riseGap + RISE_LEN,
        follows: "less",
        beats: { gap: riseGap, rise: RISE_LEN, rowGap: LINE_GAP },
      },
      {
        id: "swap",
        lane: "Swap",
        label: "Swap",
        start: swapAt,
        length: Math.max(
          Math.max(0, n1 - 1) * drainStep + DRAIN_LEN,
          GROW_DELAY + Math.max(0, n2 - 1) * growStep,
        ),
        beats: {
          drainStep,
          drain: DRAIN_LEN,
          grow: GROW_DELAY,
          growStep,
        },
      },
      {
        id: "fill",
        lane: "Fill",
        label: "Fill",
        start: fillAt,
        length: Math.max(0, n2 - 1) * fillStep + FILL_LEN,
        follows: fillAt >= swapAt ? "swap" : undefined,
        beats: { step: fillStep, letter: FILL_LEN },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
