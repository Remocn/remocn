import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line rising in, the slug fading in above them and flipping from
// embargoed to lifted, then each redaction bar lifting off its words.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. When the
// bars would run past the clip, the whole schedule is compressed to fit.
// The ids are public: a saved `timing` prop refers to them.

export type EmbargoLiftElementId =
  | `line:${number}`
  | "slug"
  | "flip"
  | `bar:${number}`;

export interface EmbargoLiftTimingProps {
  lines?: string[];
  stagger?: number;
}

export const DEFAULT_LINES = [
  "remocn is [free],",
  "[open source]",
  "and [out today].",
];

const LINE_AT = 2;
const LINE_STEP = 4;
const LINE_RISE = 20;
const SLUG_AT = 10;
const SLUG_IN = 16;
const T_SLUG = 50;
const FLIP = 12;
const T_LIFT = 58;
export const LIFT_STEP = 14;
const LIFT_DUR = 16;
const HOLD = 34;

export interface Seg {
  text: string;
  hidden: boolean;
  bar: number;
}

function parseLine(line: string, start: number): Seg[] {
  const out: Seg[] = [];
  let bar = start;
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  for (let r = re.exec(line); r; r = re.exec(line)) {
    if (r.index > last)
      out.push({ text: line.slice(last, r.index), hidden: false, bar: -1 });
    out.push({ text: r[1], hidden: true, bar });
    bar += 1;
    last = r.index + r[0].length;
  }
  if (last < line.length)
    out.push({ text: line.slice(last), hidden: false, bar: -1 });
  return out;
}

/** The lines split into segments; `[bracketed]` text is hidden under a bar. */
export function rowsOf(lines: string[]) {
  const rows: Seg[][] = [];
  let barCount = 0;
  for (const l of lines.length > 0 ? lines : ["[out today]."]) {
    const segs = parseLine(l, barCount);
    barCount += segs.filter((s) => s.hidden).length;
    rows.push(segs);
  }
  return { rows, barCount };
}

// `line:<r>` is a line of text, `bar:<b>` the b-th bar across all lines in
// reading order; both lists are chains. `length` here is the clip length
// without `speed`, as the pace is counted.
export const embargoLiftTimeline = defineTimeline<
  EmbargoLiftElementId,
  EmbargoLiftTimingProps
>(({ lines = DEFAULT_LINES, stagger = LIFT_STEP }, { length }) => {
  const { rows, barCount } = rowsOf(lines);
  const naturalEnd =
    T_LIFT + Math.max(0, barCount - 1) * stagger + LIFT_DUR + HOLD;
  const pace = Math.max(1, naturalEnd / Math.max(1, length));
  const bars = rows.flat().filter((s) => s.hidden);
  const elements: TimelineElement<EmbargoLiftElementId>[] = [
    ...rows.map(
      (segs, r): TimelineElement<EmbargoLiftElementId> => ({
        id: `line:${r}`,
        lane: "Lines",
        label: segs.map((s) => s.text).join(""),
        start: (LINE_AT + r * LINE_STEP) / pace,
        length: LINE_RISE / pace,
        follows: r > 0 ? `line:${r - 1}` : undefined,
      }),
    ),
    {
      id: "slug",
      lane: "Slug",
      label: "slug in",
      start: SLUG_AT / pace,
      length: SLUG_IN / pace,
    },
    {
      id: "flip",
      lane: "Slug",
      label: "lifted",
      start: T_SLUG / pace,
      length: FLIP / pace,
    },
    ...bars.map(
      (s, b): TimelineElement<EmbargoLiftElementId> => ({
        id: `bar:${b}`,
        lane: "Bars",
        label: s.text,
        start: (T_LIFT + b * stagger) / pace,
        length: LIFT_DUR / pace,
        follows: b > 0 ? `bar:${b - 1}` : undefined,
      }),
    ),
  ];
  return elements.sort((a, b) => a.start - b.start);
});
