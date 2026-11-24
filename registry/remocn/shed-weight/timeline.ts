import { defineTimeline } from "@/lib/remocn/timeline";

// The cuts of the stack, smallest optical size first: each one's rule draws
// in, then the line rises out of its mask, the steps widening down the
// stack. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type ShedWeightElementId = `cut:${number}`;

export interface ShedWeightTimingProps {
  sizes?: number;
}

const FIRST_AT = 4;
const STEP_MIN = 6;
const STEP_MAX = 11;
/** The line rises over `RISE_LEN`. */
const RISE_LEN = 16;
/** The rule starts `RULE_AT` from the cut (negative) and draws over `RULE_LEN`. */
const RULE_AT = -4;
const RULE_LEN = 14;

/** How many cuts the stack shows for `sizes`. */
export function cutCount(sizes: number) {
  return Math.max(2, Math.min(9, Math.round(sizes)));
}

// `cut:<k>` is the line rising over the element; its rule draws from `rule`
// over `ruleLen`. Each cut follows the one before.
export const shedWeightTimeline = defineTimeline<
  ShedWeightElementId,
  ShedWeightTimingProps
>(({ sizes = 6 }) => {
  const n = cutCount(sizes);
  const startAt: number[] = [];
  let at = FIRST_AT;
  for (let k = 0; k < n; k++) {
    startAt.push(at);
    const u = n > 1 ? k / (n - 1) : 1;
    at += STEP_MIN + (STEP_MAX - STEP_MIN) * u;
  }
  return startAt.map((start, k) => ({
    id: `cut:${k}`,
    lane: "Cuts",
    label: `cut ${k + 1}`,
    start,
    length: RISE_LEN,
    follows: k > 0 ? `cut:${k - 1}` : undefined,
    beats: { rule: RULE_AT, ruleLen: RULE_LEN },
  }));
});
