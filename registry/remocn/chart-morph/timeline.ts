import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The chart morph: a donut ring drawing in and spinning, unrolling into a
// stacked bar, each segment tipping up into its own column, the columns
// collapsing one by one into a line chart, then the end value landing with
// its caption under a slow push. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type ChartMorphElementId =
  | "stage"
  | "ring"
  | "drift"
  | "push"
  | "unroll"
  | `tip:${number}`
  | "axis"
  | `collapse:${number}`
  | "label";

/** A datum as the schedule reads it (`ChartMorphDatum`). */
export interface MorphDatum {
  label: string;
  value: number;
}

export interface ChartMorphTimingProps {
  data?: MorphDatum[];
  stagger?: number;
}

export const DEFAULT_MORPH_DATA: MorphDatum[] = [
  { label: "Jan", value: 12 },
  { label: "Feb", value: 18 },
  { label: "Mar", value: 23 },
  { label: "Apr", value: 31 },
  { label: "May", value: 46 },
];

const DRAW = [0, 24] as const;
const SPIN = [0, 30] as const;
const UNROLL = [30, 60] as const;
const TIP_START = 64;
const TIP_STAGGER = 3;
const TIP_DUR = 24;
const COLLAPSE_START = 100;
const COLLAPSE_STAGGER = 2;
const COLLAPSE_DUR = 22;
const LABEL_IN = 131;

// `stage` fades the stage in. `ring` spins the donut into place over its
// length, drawing it over `draw`; `unroll` unrolls it into a stacked bar.
// The ring holds until the first tip starts. `tip:<i>` tips segment `i` up
// into its column; the tips form a chain. `axis` brings the baseline in
// over its length and the column labels from `labelsAt` to `labels`.
// `collapse:<i>` folds column `i` into its point of the line; the collapses
// form a chain, and the columns hold until the first starts. `label`
// follows the last collapse: the dots come in from `dotsAt` to `dots`, the
// value over `value`, the caption from `captionAt` to `caption` and the
// area from `areaAt` to `area`. `drift` and `push` are the background drift
// and the slow camera push.
export const chartMorphTimeline = defineTimeline<
  ChartMorphElementId,
  ChartMorphTimingProps
>(({ data = DEFAULT_MORPH_DATA, stagger = TIP_STAGGER }) => {
  const list = data.slice(0, 5);
  const n = list.length;
  const elements: TimelineElement<ChartMorphElementId>[] = [
    { id: "stage", lane: "Stage", label: "fade in", start: 0, length: 8 },
    {
      id: "ring",
      lane: "Chart",
      label: "ring",
      start: SPIN[0],
      length: SPIN[1] - SPIN[0],
      beats: { draw: DRAW[1] - DRAW[0] },
    },
    { id: "drift", lane: "Background", label: "drift", start: 0, length: 182 },
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: 0,
      length: LABEL_IN + 40,
    },
    {
      id: "unroll",
      lane: "Chart",
      label: "unroll",
      start: UNROLL[0],
      length: UNROLL[1] - UNROLL[0],
      follows: "ring",
    },
  ];
  list.forEach((d, i) => {
    elements.push({
      id: `tip:${i}`,
      lane: "Bars",
      label: d.label,
      start: TIP_START + i * stagger,
      length: TIP_DUR,
      follows: i > 0 ? `tip:${i - 1}` : "unroll",
    });
  });
  elements.push({
    id: "axis",
    lane: "Axis",
    label: "axis",
    start: TIP_START + 14,
    length: 24,
    follows: n > 0 ? "tip:0" : undefined,
    beats: { labelsAt: 8, labels: 26 },
  });
  list.forEach((d, i) => {
    elements.push({
      id: `collapse:${i}`,
      lane: "Line",
      label: d.label,
      start: COLLAPSE_START + i * COLLAPSE_STAGGER,
      length: COLLAPSE_DUR,
      follows: i > 0 ? `collapse:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "label",
    lane: "Label",
    label: "end value",
    start: LABEL_IN,
    length: 24,
    follows: n > 0 ? `collapse:${n - 1}` : undefined,
    beats: {
      dotsAt: -6,
      dots: 10,
      value: 20,
      captionAt: 6,
      caption: 24,
      areaAt: -6,
      area: 22,
    },
  });
  return elements.sort((a, b) => a.start - b.start);
});
