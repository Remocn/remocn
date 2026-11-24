import { defineTimeline } from "@/lib/remocn/timeline";

// When each bar springs up from the baseline. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type AnimatedBarChartElementId = `bar:${number}`;

export interface AnimatedBarChartTimingProps {
  data?: number[];
  labels?: string[];
  staggerFrames?: number;
}

export const DEFAULT_DATA = [35, 60, 45, 80, 55, 70, 90, 65];
const STAGGER_FRAMES = 6;
/** Frames the bar's spring takes to settle. */
const RISE = 19;

// `bar:<i>` springs bar `i` up, `staggerFrames` after the one before; a chain.
export const animatedBarChartTimeline = defineTimeline<
  AnimatedBarChartElementId,
  AnimatedBarChartTimingProps
>(({ data = DEFAULT_DATA, labels, staggerFrames = STAGGER_FRAMES }) =>
  data.map((value, i) => ({
    id: `bar:${i}`,
    lane: "Bars",
    label: labels?.[i] ?? String(value),
    start: i * staggerFrames,
    length: RISE,
    follows: i > 0 ? `bar:${i - 1}` : undefined,
  })),
);
