import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The legal text rising row by row, then clause by clause: the clause lights
// up, drops out, the text reflows around its plain rewrite, the rewrite
// rises word by word and cools to the ink (except the highlighted one); at
// the end the box zooms to fit the rewrites. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. When the schedule runs past the clip
// it is compressed to fit (`pace`). The ids are public: a saved `timing`
// prop refers to them.

export type PlainLicenseElementId =
  | "intro"
  | `mark:${number}`
  | `out:${number}`
  | `move:${number}`
  | `plain:${number}:${number}`
  | `cool:${number}`
  | "zoom";

export interface PlainLicenseClause {
  legal: string;
  plain: string;
}

export interface PlainLicenseTimingProps {
  clauses?: PlainLicenseClause[];
  highlight?: number;
  step?: number;
  /** Frames between words of a plain rewrite as they rise in. */
  stagger?: number;
}

export const DEFAULT_CLAUSES: PlainLicenseClause[] = [
  {
    legal: "Permission is hereby granted, free of charge,",
    plain: "Free,",
  },
  {
    legal:
      "to any person obtaining a copy of this software and associated documentation files (the “Software”),",
    plain: "for anyone,",
  },
  {
    legal:
      "to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.",
    plain: "for anything.",
  },
];

const INTRO_AT = 2;
const INTRO = 18;
/** Each wrapped row of legal text rises this much after the row above. */
const INTRO_ROW = 2;
const T0 = 36;
const MIN_STEP = 34;
const MARK = 8;
const OUT_AT = 13;
const OUT = 9;
const MOVE_AT = 16;
const MOVE = 18;
const PLAIN_AT = 24;
const PLAIN = 14;
const COOL_AT = 50;
const COOL = 18;
const ZOOM_LAG = 34;
const ZOOM = 26;
const HOLD = 34;

/** The clauses shown: the given ones, or the defaults when empty. */
export function clausesOf(clauses: PlainLicenseClause[]) {
  return clauses.length > 0 ? clauses : DEFAULT_CLAUSES;
}

export function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// `intro` rises the first row of legal text; each wrapped row after it
// starts its `row` beat later (rows come from measuring, so they are not
// elements). Per clause `i`: `mark:<i>` lights it up, `out:<i>` drops it,
// `move:<i>` reflows the text, `plain:<i>:<j>` rises word `j` of its rewrite
// (a chain) and `cool:<i>` fades the rewrite to the ink after the reflow,
// unless it is the highlight. Each clause's mark follows the previous clause's move; `zoom`
// follows the last move. `length` here is the clip after `delay`, without
// `speed`, as the pace is counted.
export const plainLicenseTimeline = defineTimeline<
  PlainLicenseElementId,
  PlainLicenseTimingProps
>(
  (
    { clauses = DEFAULT_CLAUSES, highlight = 0, step = 40, stagger = 3 },
    { length },
  ) => {
    const list = clausesOf(clauses);
    const n = list.length;
    const stepLen = Math.max(MIN_STEP, step);
    const S = (k: number) => T0 + k * stepLen;
    const zoomAt = S(n - 1) + ZOOM_LAG;
    const naturalEnd = zoomAt + ZOOM + HOLD;
    const pace = Math.max(1, naturalEnd / Math.max(1, length));

    const elements: TimelineElement<PlainLicenseElementId>[] = [
      {
        id: "intro",
        lane: "Legal",
        label: "legal text",
        start: INTRO_AT / pace,
        length: INTRO / pace,
        beats: { row: INTRO_ROW / pace },
      },
    ];
    list.forEach((cl, i) => {
      const st = S(i);
      const words = splitWords(cl.plain);
      elements.push(
        {
          id: `mark:${i}`,
          lane: "Legal",
          label: `clause ${i + 1}`,
          start: st / pace,
          length: MARK / pace,
          follows: i > 0 ? `move:${i - 1}` : undefined,
        },
        {
          id: `out:${i}`,
          lane: "Legal",
          label: `clause ${i + 1} out`,
          start: (st + OUT_AT) / pace,
          length: OUT / pace,
          follows: `mark:${i}`,
        },
        {
          id: `move:${i}`,
          lane: "Reflow",
          label: `reflow ${i + 1}`,
          start: (st + MOVE_AT) / pace,
          length: MOVE / pace,
          follows: `out:${i}`,
        },
      );
      words.forEach((w, j) => {
        elements.push({
          id: `plain:${i}:${j}`,
          lane: "Plain",
          label: w,
          start: (st + PLAIN_AT + j * stagger) / pace,
          length: PLAIN / pace,
          follows: j > 0 ? `plain:${i}:${j - 1}` : `out:${i}`,
        });
      });
      if (i !== highlight) {
        elements.push({
          id: `cool:${i}`,
          lane: "Plain",
          label: `cool ${i + 1}`,
          start: (st + COOL_AT) / pace,
          length: COOL / pace,
          follows: `move:${i}`,
        });
      }
    });
    elements.push({
      id: "zoom",
      lane: "Zoom",
      label: "zoom",
      start: zoomAt / pace,
      length: ZOOM / pace,
      follows: `move:${n - 1}`,
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
