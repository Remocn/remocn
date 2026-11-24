import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The stacked column: the bars rising in, one shift per year (the column
// steps aside, the bars restack, it steps back), then the final pose with
// the caption. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type StackedShiftElementId = "enter" | `shift:${number}` | "final";

export interface StackedShiftTimingProps {
  series?: readonly { values: readonly number[] }[];
  years?: readonly string[];
  hold?: number;
}

export const STACKED_SERIES = [
  { label: "remocn", values: [6, 24, 52] },
  { label: "Kitebase", values: [34, 28, 18] },
  { label: "Lumen", values: [26, 22, 14] },
  { label: "Fernway", values: [18, 14, 9] },
  { label: "Other", values: [16, 12, 7] },
];
export const STACKED_YEARS = ["2023", "2024", "2025"];
const FIRST_SHIFT = 34;
const SHIFT_EVERY = 54;
/** A shift, from its start: out to the side, restack, back in. */
const OUT_TO = 12;
const MOVE_AT = 10;
const MOVE_TO = 36;
const IN_AT = 32;
const IN_TO = 44;

/** How many years the chart shows, as the component counts them. */
function yearCount(
  series: readonly { values: readonly number[] }[],
  years: readonly string[],
) {
  const list = series.slice(0, 6);
  return Math.max(
    1,
    Math.min(years.length, ...list.map((s) => s.values.length)),
  );
}

// `enter` reveals the bars over its length; the year label rises from
// `yearAt` over `year`. `shift:<k>` moves from year k to year k + 1: the
// column steps aside until `outTo`, the bars restack from `moveAt` to
// `moveTo` and it steps back from `inAt` to `inTo` (offsets from the
// start); the shifts form a chain. `final` settles the hero number over its
// length, brings the caption in from `capAt` over `cap`, and the slow push
// and sheen land at `push`.
export const stackedShiftTimeline = defineTimeline<
  StackedShiftElementId,
  StackedShiftTimingProps
>(({ series = STACKED_SERIES, years = STACKED_YEARS, hold = SHIFT_EVERY }) => {
  const Y = yearCount(series, years);
  const elements: TimelineElement<StackedShiftElementId>[] = [
    {
      id: "enter",
      lane: "Chart",
      label: "bars rise",
      start: 0,
      length: 26,
      beats: { yearAt: 8, year: 18 },
    },
  ];
  for (let k = 0; k < Y - 1; k++) {
    elements.push({
      id: `shift:${k}`,
      lane: "Years",
      label: `${years[k]} → ${years[k + 1]}`,
      start: FIRST_SHIFT + k * hold,
      length: IN_TO,
      follows: k > 0 ? `shift:${k - 1}` : "enter",
      beats: {
        outTo: OUT_TO,
        moveAt: MOVE_AT,
        moveTo: MOVE_TO,
        inAt: IN_AT,
        inTo: IN_TO,
      },
    });
  }
  const lastEnd = FIRST_SHIFT + (Y - 2) * hold + IN_TO;
  elements.push({
    id: "final",
    lane: "Chart",
    label: "final",
    start: lastEnd - 6,
    length: 20,
    follows: Y > 1 ? `shift:${Y - 2}` : "enter",
    beats: { capAt: 4, cap: 20, push: 36 },
  });
  return elements;
});
