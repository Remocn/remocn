import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The axis and title fading in, the starting bar growing, each step bar
// growing from the level the one before left, and the total: its bar
// springing up, the figure counting to it, the rest of the chart dimming.
// The camera pushes in and lifts the chart as the total arrives. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type WaterfallChartElementId =
  | "push"
  | "drift"
  | "axis"
  | "title"
  | "base"
  | `step:${number}`
  | "settle"
  | "total"
  | "focus";

interface Step {
  label: string;
  value: number;
}

export interface WaterfallChartTimingProps {
  start?: Step;
  steps?: Step[];
  totalLabel?: string;
  grow?: number;
}

export const DEFAULT_START: Step = { label: "Start", value: 52 };

export const DEFAULT_STEPS: Step[] = [
  { label: "Churn", value: -7 },
  { label: "Contraction", value: -3 },
  { label: "New", value: 24 },
  { label: "Expansion", value: 12 },
  { label: "Reactivation", value: 6 },
];

/** The steps the chart shows: the first eight. */
export function shownSteps(steps: Step[]) {
  return steps.slice(0, 8);
}

/** Beats every column has: its connector, from the column before, and label. */
const COLUMN = { connect: -7, connectEnd: 1, label: 14 };

// A column (`base`, `step:<i>`, `total`) grows over its length; the
// connector from the column before draws from `connect` to `connectEnd` and
// the label rises over `label`. A bar's value rises from `valueIn` to
// `valueEnd`, counted from the bar's END. The steps are a chain after
// `base`. `total` springs its bar up, counts the figure over `count`, lands
// it from `landAt` to `landEnd` and its unit from `unitAt` to `unitEnd`.
// `settle` lifts the chart and `focus` dims all but the total.
export const waterfallChartTimeline = defineTimeline<
  WaterfallChartElementId,
  WaterfallChartTimingProps
>(
  ({
    start = DEFAULT_START,
    steps = DEFAULT_STEPS,
    totalLabel = "MRR",
    grow = 15,
  }) => {
    const list = shownSteps(steps);
    const STAGGER = list.length > 5 ? 7 : 9;
    const TOTAL_AT = 26 + list.length * STAGGER + 6;
    const bar = { ...COLUMN, valueIn: -8, valueEnd: 6 };
    const last: WaterfallChartElementId =
      list.length > 0 ? `step:${list.length - 1}` : "base";
    // The settle starts before the last step when steps are close together;
    // it follows the latest bar already under way.
    let before = -1;
    list.forEach((_, i) => {
      if (26 + i * STAGGER <= TOTAL_AT - 14) before = i;
    });
    const settleAfter: WaterfallChartElementId =
      before >= 0 ? `step:${before}` : "base";
    const elements: TimelineElement<WaterfallChartElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "Push",
        start: 0,
        length: TOTAL_AT + 60,
      },
      {
        id: "drift",
        lane: "Colour",
        label: "Drift",
        start: 0,
        length: TOTAL_AT + 70,
      },
      { id: "axis", lane: "Axis", label: "Axis", start: 0, length: 18 },
      { id: "title", lane: "Title", label: "Title", start: 4, length: 18 },
      {
        id: "base",
        lane: "Bars",
        label: start.label,
        start: 8,
        length: 22,
        beats: bar,
      },
      ...list.map(
        (s, i): TimelineElement<WaterfallChartElementId> => ({
          id: `step:${i}`,
          lane: "Bars",
          label: s.label,
          start: 26 + i * STAGGER,
          length: grow,
          follows: i > 0 ? `step:${i - 1}` : "base",
          beats: bar,
        }),
      ),
      {
        id: "settle",
        lane: "Camera",
        label: "Settle",
        start: TOTAL_AT - 14,
        length: 36,
        follows: settleAfter,
      },
      {
        id: "total",
        lane: "Bars",
        label: totalLabel,
        start: TOTAL_AT,
        length: 26,
        follows: last,
        beats: {
          ...COLUMN,
          count: 24,
          landAt: 2,
          landEnd: 22,
          unitAt: 12,
          unitEnd: 30,
        },
      },
      {
        id: "focus",
        lane: "Focus",
        label: "Focus",
        start: TOTAL_AT + 14,
        length: 20,
        follows: "total",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
