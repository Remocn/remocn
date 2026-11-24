import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line rising in, its tail lighting up in the accent, the tails sliding
// into one column, merging upward one by one, and the last tail lifting below
// the list as the payoff. Every beat scales with the scene length (`k`).
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type FactorOutElementId =
  | `line:${number}`
  | `spot:${number}`
  | "align"
  | `merge:${number}`
  | "lift";

export interface FactorOutTimingProps {
  heads?: string[];
  /** Frames between one line entering and the next. */
  stagger?: number;
}

export const DEFAULT_HEADS = [
  "Write the scenes",
  "Pick the colors",
  "Fix the typos",
];
const STAGGER = 8;
/** Frames a line takes to rise into place. */
const RISE = 18;
/** Frames a tail takes to turn the accent colour. */
const TINT = 12;

export const factorOutTimeline = defineTimeline<
  FactorOutElementId,
  FactorOutTimingProps
>(({ heads = DEFAULT_HEADS, stagger = STAGGER }, { length }) => {
  const list = heads.length > 0 ? heads : DEFAULT_HEADS;
  const n = list.length;
  const span = length;
  const k = Math.min(1.5, Math.max(0.85, (span - 50) / 140));
  const enterAt = (i: number) => (6 + i * stagger) * k;
  const spotAt = (i: number) => (44 + i * 4) * k;
  const alignAt = 62 * k;
  const MERGE = 15 * k;
  const mergeAt = (i: number) => (86 + i * 18) * k;
  const liftAt = mergeAt(n - 2) + MERGE + 8 * k;
  const LIFT = 26 * k;

  const elements: TimelineElement<FactorOutElementId>[] = [];
  list.forEach((head, i) => {
    elements.push({
      id: `line:${i}`,
      lane: "Lines",
      label: head,
      start: enterAt(i),
      length: RISE,
      follows: i > 0 ? `line:${i - 1}` : undefined,
    });
  });
  list.forEach((head, i) => {
    elements.push({
      id: `spot:${i}`,
      lane: "Spotlight",
      label: head,
      start: spotAt(i),
      length: TINT,
      follows: i > 0 ? `spot:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "align",
    lane: "Align",
    label: "align tails",
    start: alignAt,
    length: 22 * k,
  });
  // A merge folds tail `i` into the next one, which lands `land` frames in
  // and bumps over `bump`.
  for (let i = 0; i < n - 1; i++) {
    elements.push({
      id: `merge:${i}`,
      lane: "Merges",
      label: list[i],
      start: mergeAt(i),
      length: MERGE,
      follows: i > 0 ? `merge:${i - 1}` : undefined,
      beats: { land: MERGE * 0.35, bump: 10 * k },
    });
  }
  elements.push({
    id: "lift",
    lane: "Lift",
    label: "lift",
    start: liftAt,
    length: LIFT,
    follows: n > 1 ? `merge:${n - 2}` : undefined,
  });
  return elements.sort((a, b) => a.start - b.start);
});
