import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The chart fading in with its title and year labels, the bars growing
// (the accent bar on its own slower spring, its value showing), the axis
// morphing from linear to log, then the value labels and the accent's
// value growing while the others dim. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type LogRescaleElementId =
  | "intro"
  | "title"
  | "years"
  | "bars"
  | "accent"
  | "morph"
  | "labels";

export interface LogRescaleDatum {
  label: string;
  value: number;
}

export interface LogRescaleTimingProps {
  data?: LogRescaleDatum[];
  morphAt?: number;
}

export const DEFAULT_DATA: LogRescaleDatum[] = [
  { label: "2021", value: 340 },
  { label: "2022", value: 1200 },
  { label: "2023", value: 4800 },
  { label: "2024", value: 18000 },
  { label: "2025", value: 96000 },
  { label: "2026", value: 2400000 },
];

const MORPH = [64, 106] as const;
const ACCENT_GROW = 24;
const LABELS_AT = 100;

// Year label `i` fades in from `years.start + i * stagger` over `each`; the
// other bars grow one after another the same way in `bars`, skipping the
// accent. The accent bar grows on a spring from its start and its value
// fades in from `valueAt` to the end. The morph swaps the scale tag from
// `swapIn` to `swapOut`. In `labels` the accent's value grows over the
// element, the other bars dim over `dim`, and the other values fade in one
// after another (`stagger`, `each`).
export const logRescaleTimeline = defineTimeline<
  LogRescaleElementId,
  LogRescaleTimingProps
>(
  ({
    data = DEFAULT_DATA,
    morphAt = MORPH[0],
  }): TimelineElement<LogRescaleElementId>[] => {
    const n = (data.length > 0 ? data : DEFAULT_DATA).length;
    const others = Math.max(0, n - 2);
    const elements: TimelineElement<LogRescaleElementId>[] = [
      { id: "intro", lane: "Chart", label: "fade in", start: 0, length: 14 },
      { id: "title", lane: "Copy", label: "title", start: 2, length: 16 },
      {
        id: "years",
        lane: "Axis",
        label: "years",
        start: 4,
        length: (n - 1) * 2 + 12,
        beats: { stagger: 2, each: 12 },
      },
      {
        id: "bars",
        lane: "Bars",
        label: "bars grow",
        start: 6,
        length: others * 3 + 20,
        beats: { stagger: 3, each: 20 },
      },
      {
        id: "accent",
        lane: "Accent",
        label: "accent bar",
        start: ACCENT_GROW,
        length: 26,
        beats: { valueAt: 14 },
      },
      {
        id: "morph",
        lane: "Axis",
        label: "linear to log",
        start: morphAt,
        length: MORPH[1] - MORPH[0],
        beats: { swapIn: 4, swapOut: 20 },
      },
      {
        id: "labels",
        lane: "Labels",
        label: "values",
        start: LABELS_AT,
        length: 18,
        beats: { dim: 16, stagger: 3, each: 12 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
