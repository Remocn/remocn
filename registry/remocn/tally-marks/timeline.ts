import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The slow push under everything, the tally marks drawn faster and faster
// while the camera follows them, the camera settling, the rows and then the
// columns collapsing to the centre, the last stroke tipping over into the
// rule, the total rolling up digit by digit and the label. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type TallyMarksElementId =
  | "push"
  | "tally"
  | "settle"
  | "rows"
  | "cols"
  | "tip"
  | "number"
  | "label";

export interface TallyMarksTimingProps {
  value?: number;
  stagger?: number;
}

const T0 = 6;
const TALLY = 66;
const ROW_IN = 78;
const ROW_LEN = 18;
const COL_IN = 90;
const COL_LEN = 18;
const COL_STAGGER = 4;
const TIP = COL_IN + COL_LEN + COL_STAGGER;
const NUM_IN = TIP + 10;

export function formatNumber(n: number) {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// `tally` draws every mark over its length, accelerating. `rows` and `cols`
// each move over `move`, the middle row or column up to `spread` frames
// later than the edges. `tip` is the last stroke swinging into the rule.
// `number` rolls the total in, a character every `stagger` frames, each
// over `rise`. Each element follows the one before it on the way.
export const tallyMarksTimeline = defineTimeline<
  TallyMarksElementId,
  TallyMarksTimingProps
>(({ value = 1240, stagger = 2 }) => {
  const chars = formatNumber(value).length;
  const elements: TimelineElement<TallyMarksElementId>[] = [
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: 0,
      length: TIP + 30,
      beats: { drift: TIP + 40 },
    },
    { id: "tally", lane: "Marks", label: "Tally", start: T0, length: TALLY },
    {
      id: "settle",
      lane: "Camera",
      label: "Settle",
      start: T0 + TALLY - 6,
      length: ROW_IN - (T0 + TALLY - 6),
      follows: "tally",
    },
    {
      id: "rows",
      lane: "Marks",
      label: "Rows collapse",
      start: ROW_IN,
      length: ROW_LEN + 2,
      follows: "settle",
      beats: { move: ROW_LEN, spread: 2 },
    },
    {
      id: "cols",
      lane: "Marks",
      label: "Columns collapse",
      start: COL_IN,
      length: COL_LEN + COL_STAGGER,
      follows: "rows",
      beats: { move: COL_LEN, spread: COL_STAGGER },
    },
    {
      id: "tip",
      lane: "Marks",
      label: "Tip into rule",
      start: TIP,
      length: NUM_IN - TIP,
      follows: "cols",
    },
    {
      id: "number",
      lane: "Total",
      label: "Total",
      start: NUM_IN,
      length: (chars - 1) * stagger + 18,
      follows: "tip",
      beats: { stagger, rise: 18 },
    },
    {
      id: "label",
      lane: "Total",
      label: "Label",
      start: NUM_IN + 12,
      length: 18,
      follows: "number",
    },
  ];
  return elements;
});
