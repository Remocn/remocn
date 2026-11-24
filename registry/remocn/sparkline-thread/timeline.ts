import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The axis drawing, the data points popping in left to right, the thin
// thread running through them, the thick line following it (the fill
// rising under it), then the last point blooming, its leader, the metric
// and the label. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type SparklineThreadElementId =
  | "points"
  | "axis"
  | "thread"
  | "thicken"
  | "bloom"
  | "leader"
  | "metric"
  | "label";

export interface SparklineThreadTimingProps {
  values?: number[];
  stagger?: number;
  drawDuration?: number;
}

export const DEFAULT_VALUES = [
  20, 26, 24, 29, 35, 34, 41, 38, 49, 56, 53, 64, 70, 77,
];

const POP = -6;
const POP_STAGGER = 2;
const THREAD = [22, 64] as const;
const THICKEN = [62, 84] as const;
const BLOOM = 82;

// In `points` point `i` pops from `start + i * stagger`: its tick draws
// over `tick`, the dot fades in over `fade`. The thread's head fades in
// over `headIn` and out from `headOut` before its end to `headGone` after
// it. The fill under the thick line rises from `fillAt` after its start to
// `fillAfter` past its end. `drawDuration` stretches the thread and the
// beat after it; the thick line and the bloom follow the thread, the
// leader, the metric and the label follow the bloom.
export const sparklineThreadTimeline = defineTimeline<
  SparklineThreadElementId,
  SparklineThreadTimingProps
>(
  ({
    values = DEFAULT_VALUES,
    stagger = POP_STAGGER,
    drawDuration = THREAD[1] - THREAD[0],
  }): TimelineElement<SparklineThreadElementId>[] => {
    const count = values.length >= 2 ? values.length : DEFAULT_VALUES.length;
    const stretch = drawDuration / (THREAD[1] - THREAD[0]);
    const at = (f: number) => THREAD[0] + (f - THREAD[0]) * stretch;
    const thickAt = at(THICKEN[0]);
    const bloomAt = at(BLOOM);
    const elements: TimelineElement<SparklineThreadElementId>[] = [
      {
        id: "points",
        lane: "Points",
        label: "points pop",
        start: POP,
        length: (count - 1) * stagger + 8,
        beats: { stagger, tick: 8, fade: 5 },
      },
      { id: "axis", lane: "Axis", label: "axis", start: 0, length: 26 },
      {
        id: "thread",
        lane: "Line",
        label: "thread",
        start: THREAD[0],
        length: (THREAD[1] - THREAD[0]) * stretch,
        beats: { headIn: 4, headOut: 4, headGone: 2 },
      },
      {
        id: "thicken",
        lane: "Line",
        label: "thick line",
        start: thickAt,
        length: at(THICKEN[1]) - thickAt,
        follows: "thread",
        beats: { fillAt: 6, fillAfter: 10 },
      },
      {
        id: "bloom",
        lane: "Bloom",
        label: "bloom",
        start: bloomAt,
        length: 28,
        follows: "thread",
      },
      {
        id: "leader",
        lane: "Metric",
        label: "leader",
        start: bloomAt + 2,
        length: 14,
        follows: "bloom",
      },
      {
        id: "metric",
        lane: "Metric",
        label: "metric",
        start: bloomAt + 6,
        length: 18,
        follows: "bloom",
        beats: { count: 24 },
      },
      {
        id: "label",
        lane: "Label",
        label: "label",
        start: bloomAt + 16,
        length: 18,
        follows: "bloom",
      },
    ];
    return elements;
  },
);
