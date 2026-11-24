import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The table's rules drawing in, each partial row rising and counting up,
// then each merge step folding pairs of rows into their sum until one total
// is left, and the total filling with the accent. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type CoreSumElementId =
  | "rules"
  | `row:${number}`
  | `merge:${number}`
  | "fill";

export interface CoreSumTimingProps {
  parts?: number;
  stagger?: number;
  mergeGap?: number;
}

const COUNT_LEN = 36;
export const STAGGER = 2;
const FIRST_MERGE = 48;
export const MERGE_GAP = 16;
const MERGE_LEN = 15;

/** Rows in the first table: `parts` rounded to a power of two, 2 to 16. */
export function partCount(parts: number) {
  const p = Math.round(Math.log2(Math.max(2, parts)));
  return 2 ** Math.max(1, Math.min(4, p));
}

// `row:<i>` counts row i up over its length, rising over `rise`; each row
// follows the one before. `merge:<l>` folds the table down to level l over
// its length; each merge follows the one before, and `fill` follows the
// last.
export const coreSumTimeline = defineTimeline<
  CoreSumElementId,
  CoreSumTimingProps
>(({ parts = 8, stagger = STAGGER, mergeGap = MERGE_GAP }) => {
  const count = partCount(parts);
  const levels = Math.round(Math.log2(count));
  const mergeAt = (l: number) => FIRST_MERGE + (l - 1) * mergeGap;
  const elements: TimelineElement<CoreSumElementId>[] = [
    { id: "rules", lane: "Table", label: "Rules", start: 0, length: 20 },
    ...Array.from(
      { length: count },
      (_, i): TimelineElement<CoreSumElementId> => ({
        id: `row:${i}`,
        lane: "Rows",
        label: `Row ${i + 1}`,
        start: i * stagger,
        length: COUNT_LEN,
        follows: i > 0 ? `row:${i - 1}` : undefined,
        beats: { rise: 14 },
      }),
    ),
    ...Array.from(
      { length: levels },
      (_, k): TimelineElement<CoreSumElementId> => ({
        id: `merge:${k + 1}`,
        lane: "Merge",
        label: k + 1 === levels ? "Total" : `Merge ${k + 1}`,
        start: mergeAt(k + 1),
        length: MERGE_LEN,
        follows: k > 0 ? `merge:${k}` : undefined,
      }),
    ),
    {
      id: "fill",
      lane: "Merge",
      label: "Fill",
      start: mergeAt(levels) + 4,
      length: MERGE_LEN + 10 - 4,
      follows: `merge:${levels}`,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
