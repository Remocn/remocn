import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each harmonic drawing in on its own row, the sum's slot opening, each
// harmonic folding into the sum, the sum growing into the final wave and the
// title rising under it. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type FourierSumElementId =
  | `row:${number}`
  | "slot"
  | `merge:${number}`
  | "final"
  | "title";

export interface FourierSumTimingProps {
  harmonics?: number[];
  /** Frames between harmonics folding into the sum. */
  stagger?: number;
}

export const DEFAULT_HARMONICS = [1, 3, 5, 7, 9];
const ROW_DRAW_AT = 0;
const ROW_STAGGER = 6;
const ROW_DRAW_DUR = 22;
/** A row's label fades in from `LABEL_AT` to `LABEL_END` after its draw starts. */
const LABEL_AT = 2;
const LABEL_END = 14;
const SLOT_IN = [22, 40] as const;
const MERGE_AT = 44;
const MERGE_STAGGER = 11;
const MERGE_DUR = 20;
/** A merging row's label fades out over `LABEL_OUT`. */
const LABEL_OUT = 8;
/** The final wave starts `FINAL_LEAD` before the last merge ends and runs `FINAL_DUR`. */
const FINAL_LEAD = 2;
const FINAL_DUR = 28;
const TITLE_GAP = 14;
const TITLE_DUR = 20;

// `row:<i>` draws harmonic `i`; its label fades in on the `labelAt` →
// `labelEnd` beats. `merge:<i>` folds harmonic `i` into the sum: it adds its
// weight from `weigh`, its row fades out from `fade`, its label leaves over
// `labelOut`, and its term in the caption rises from `fade` to `termTail`
// past the merge's end. Rows and merges are chains.
export const fourierSumTimeline = defineTimeline<
  FourierSumElementId,
  FourierSumTimingProps
>(({ harmonics = DEFAULT_HARMONICS, stagger = MERGE_STAGGER }) => {
  const count = harmonics.length;
  const mergeStart = (i: number) => MERGE_AT + i * stagger;
  const mergeEnd = mergeStart(count - 1) + MERGE_DUR;
  const out: TimelineElement<FourierSumElementId>[] = [];
  harmonics.forEach((n, i) => {
    out.push({
      id: `row:${i}`,
      lane: "Rows",
      label: `${n}×`,
      start: ROW_DRAW_AT + i * ROW_STAGGER,
      length: ROW_DRAW_DUR,
      follows: i > 0 ? `row:${i - 1}` : undefined,
      beats: { labelAt: LABEL_AT, labelEnd: LABEL_END },
    });
  });
  out.push({
    id: "slot",
    lane: "Sum",
    label: "sum slot",
    start: SLOT_IN[0],
    length: SLOT_IN[1] - SLOT_IN[0],
    follows: count > 0 ? "row:0" : undefined,
  });
  harmonics.forEach((n, i) => {
    out.push({
      id: `merge:${i}`,
      lane: "Merge",
      label: `${n}× into the sum`,
      start: mergeStart(i),
      length: MERGE_DUR,
      follows: i > 0 ? `merge:${i - 1}` : "slot",
      beats: {
        weigh: MERGE_DUR * 0.5,
        fade: MERGE_DUR * 0.6,
        labelOut: LABEL_OUT,
        termTail: 4,
      },
    });
  });
  const last: FourierSumElementId | undefined =
    count > 0 ? `merge:${count - 1}` : undefined;
  out.push({
    id: "final",
    lane: "Sum",
    label: "final wave",
    start: mergeEnd - FINAL_LEAD,
    length: FINAL_DUR,
    follows: last,
  });
  out.push({
    id: "title",
    lane: "Title",
    label: "title",
    start: mergeEnd + TITLE_GAP,
    length: TITLE_DUR,
    follows: "final",
  });
  return out.sort((a, b) => a.start - b.start);
});
