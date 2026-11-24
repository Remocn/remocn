import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A spreadsheet formula, typed once and filled down: the sheet rises and its
// cells fill in, the cursor clicks E2 and types the formula, enters it,
// drags the fill handle down the column, the values land row by row and
// take their color scale, then the chart button is clicked and the bars
// rise. Two lines of copy beside the sheet change with it. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SheetFormulaElementId =
  | "sheet"
  | "push"
  | "cells"
  | `line:${number}`
  | `readout:${number}`
  | "cursor"
  | "click"
  | "type"
  | "enter"
  | "drag"
  | "release"
  | "format"
  | "chart";

export interface SheetFormulaTimingProps {
  rows?: unknown[];
  formula?: string;
  charFrames?: number;
}

export const DEFAULT_FORMULA = "=D2/C2";
export const DEFAULT_CHAR_FRAMES = 3;
export const DEFAULT_ROWS: {
  month: string;
  signups: number;
  paid: number;
  revenue: number;
}[] = [
  { month: "January", signups: 1240, paid: 148, revenue: 4321 },
  { month: "February", signups: 1512, paid: 171, revenue: 5216 },
  { month: "March", signups: 1386, paid: 166, revenue: 4712 },
  { month: "April", signups: 1904, paid: 231, revenue: 7680 },
  { month: "May", signups: 2318, paid: 284, revenue: 10144 },
  { month: "June", signups: 2105, paid: 262, revenue: 8960 },
  { month: "July", signups: 2760, paid: 338, revenue: 13305 },
  { month: "August", signups: 3192, paid: 401, revenue: 16983 },
];

// The copy beside the sheet: each line slides in over `in`, and out from
// `leave` to `gone` around the next line's start.
const COPY_BEATS = { in: 14, leave: -2, gone: 6 };

export const sheetFormulaTimeline = defineTimeline<
  SheetFormulaElementId,
  SheetFormulaTimingProps
>(
  ({
    rows = DEFAULT_ROWS,
    formula = DEFAULT_FORMULA,
    charFrames = DEFAULT_CHAR_FRAMES,
  }) => {
    const n = rows.length;
    const T = { fill: 6, cursorIn: 34, click: 56, type: 64 } as Record<
      string,
      number
    >;
    T.enter = T.type + formula.length * charFrames + 8;
    T.grab = T.enter + 22;
    T.release = T.grab + 28;
    T.cf = T.release + 14;
    T.chart = T.cf + n * 3 + 14;

    const elements: TimelineElement<SheetFormulaElementId>[] = [
      { id: "sheet", lane: "Sheet", label: "sheet rises", start: 0, length: 6 },
      { id: "push", lane: "Camera", label: "slow push", start: 0, length: 290 },
      {
        id: "cells",
        lane: "Sheet",
        label: "cells fill in",
        start: T.fill,
        length: n * 2 + 4 * 0.6 + 12,
        // Each row starts `row` after the one above, each column `column`
        // after the one to its left.
        beats: { row: 2, column: 0.6 },
      },
      {
        id: "line:0",
        lane: "Copy",
        label: "type it",
        start: 8,
        length: T.grab - 6 - 8,
        beats: COPY_BEATS,
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor",
        start: T.cursorIn,
        length: 8,
      },
      {
        id: "click",
        lane: "Formula",
        label: "click E2",
        start: T.click,
        length: T.type - T.click,
        // The cursor reaches the cell at `reach` and moves off at `leave`;
        // editing starts at `edit`.
        beats: { reach: -3, leave: 6, edit: 4 },
      },
      {
        id: "type",
        lane: "Formula",
        label: formula,
        start: T.type,
        length: T.enter - T.type,
        follows: "click",
        beats: { char: charFrames, away: 12 },
      },
      {
        id: "readout:0",
        lane: "Readout",
        label: "formula",
        start: T.type,
        length: T.grab - 6 - T.type,
        follows: "click",
        beats: COPY_BEATS,
      },
      {
        id: "enter",
        lane: "Formula",
        label: "enter",
        start: T.enter,
        length: T.grab - T.enter,
        follows: "type",
        beats: { rest: 4 },
      },
      {
        id: "line:1",
        lane: "Copy",
        label: "fill it down",
        start: T.grab - 6,
        length: T.chart - 8 - (T.grab - 6),
        follows: "enter",
        beats: COPY_BEATS,
      },
      {
        id: "readout:1",
        lane: "Readout",
        label: "range",
        start: T.grab - 6,
        length: T.chart + 14 - (T.grab - 6),
        follows: "enter",
        beats: COPY_BEATS,
      },
      {
        id: "drag",
        lane: "Fill",
        label: "drag the fill handle",
        start: T.grab,
        length: T.release - T.grab,
        follows: "enter",
        // The cursor reaches the handle at `reach` and holds it from `hold`;
        // the crosshair shows from `cross`.
        beats: { reach: -3, hold: 2, cross: -6 },
      },
      {
        id: "release",
        lane: "Fill",
        label: "values land",
        start: T.release,
        length: T.cf - T.release,
        follows: "drag",
        // A value lands every `stagger` and flashes over `flash`; the drag
        // ends at `drop`, the crosshair at `crossEnd`, the cursor rests at
        // `settle`.
        beats: { stagger: 2.4, flash: 14, drop: 2, crossEnd: 6, settle: 10 },
      },
      {
        id: "format",
        lane: "Fill",
        label: "color scale",
        start: T.cf,
        length: T.chart - T.cf,
        follows: "release",
        beats: { stagger: 3 },
      },
      {
        id: "line:2",
        lane: "Copy",
        label: "chart it",
        start: T.chart - 8,
        length: 40,
        follows: "format",
        beats: COPY_BEATS,
      },
      {
        id: "chart",
        lane: "Chart",
        label: "chart",
        start: T.chart,
        length: 78,
        follows: "format",
        // The button lights from `hover` to `lit` and dims from `hoverOut` to
        // `hoverEnd`; the cursor reaches it at `reach`, moves off at `leave`
        // and away at `away`; the chart opens at `open`, its bars rise from
        // `bars` one every `stagger`; the selection clears from `deselect` to
        // `deselectEnd`.
        beats: {
          hover: -10,
          reach: -3,
          open: 3,
          leave: 10,
          bars: 10,
          stagger: 2,
          hoverOut: 14,
          hoverEnd: 22,
          away: 40,
          deselect: 70,
          deselectEnd: 78,
        },
      },
      {
        id: "readout:2",
        lane: "Readout",
        label: "average",
        start: T.chart + 14,
        length: 40,
        follows: "chart",
        beats: COPY_BEATS,
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
