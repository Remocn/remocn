import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number fading in, the label's lines rising, then each addition step
// rippling right to left through the columns: a digit changes in each
// column it reaches, and a carry disc flies to the next column when the sum
// passes ten. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type CarryCountElementId = "intro" | `line:${number}` | `step:${number}`;

export interface CarryCountTimingProps {
  value?: number;
  from?: number;
  steps?: number;
  label?: string;
}

export const DEFAULT_VALUE = 13580;
export const DEFAULT_FROM = 2855;
export const DEFAULT_LABEL = "scenes students\nbuilt in week one";

const START = 16;
const STEP_LENS = [26, 20, 16, 14, 13, 12, 12, 12];
export const COL_GAP = 5;
const NEW_COL_GAP = 3;

export function labelLines(label: string) {
  return label
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function digitsOf(n: number) {
  return Array.from(String(Math.max(0, Math.round(n))))
    .reverse()
    .map(Number);
}

/** A digit change: in step `step`, `off` frames after the step starts. */
export interface Change {
  col: number;
  step: number;
  off: number;
  digit: number;
}

/** A carry leaving column `col` at `off` and landing `gap` frames later. */
export interface Carry {
  col: number;
  step: number;
  off: number;
  gap: number;
}

export function carryPlan(from: number, value: number, steps: number) {
  const n = Math.max(1, Math.round(steps));
  const changes: Change[] = [];
  const carries: Carry[] = [];
  const stepAt: number[] = [];
  const stepLen: number[] = [];
  let cur = digitsOf(from);
  let at = START;
  for (let s = 0; s < n; s++) {
    const target = Math.round(from + ((value - from) * (s + 1)) / n);
    const prev = Math.round(from + ((value - from) * s) / n);
    const add = digitsOf(Math.max(0, target - prev));
    const next: number[] = [];
    let carry = 0;
    let off = 0;
    const len = Math.max(cur.length, add.length);
    for (let i = 0; i < len || carry > 0; i++) {
      const sum = (cur[i] ?? 0) + (add[i] ?? 0) + carry;
      const d = sum % 10;
      next.push(d);
      if (d !== cur[i] || i >= cur.length) {
        changes.push({ col: i, step: s, off, digit: d });
      }
      carry = sum >= 10 ? 1 : 0;
      const gap = i + 1 >= len ? NEW_COL_GAP : COL_GAP;
      if (carry) carries.push({ col: i, step: s, off, gap });
      off += gap;
    }
    cur = next;
    stepAt.push(at);
    stepLen.push(STEP_LENS[Math.min(s, STEP_LENS.length - 1)]);
    at += STEP_LENS[Math.min(s, STEP_LENS.length - 1)];
  }
  return {
    start: digitsOf(from),
    changes,
    carries,
    cols: cur.length,
    stepAt,
    stepLen,
  };
}

// `intro` fades the number in. `line:<k>` lifts label line k. `step:<s>`
// is one addition, lasting until the next one starts; it ripples from the
// ones column left, a column every `ripple` frames (the last column
// sooner). Each step follows the one before.
export const carryCountTimeline = defineTimeline<
  CarryCountElementId,
  CarryCountTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    from = DEFAULT_FROM,
    steps = 5,
    label = DEFAULT_LABEL,
  }) => {
    const p = carryPlan(Math.min(from, value), Math.max(from, value), steps);
    const elements: TimelineElement<CarryCountElementId>[] = [
      { id: "intro", lane: "Number", label: "Fade in", start: 0, length: 18 },
      ...labelLines(label).map(
        (line, k): TimelineElement<CarryCountElementId> => ({
          id: `line:${k}`,
          lane: "Label",
          label: line,
          start: 6 + k * 4,
          length: 20,
        }),
      ),
      ...p.stepAt.map(
        (at, s): TimelineElement<CarryCountElementId> => ({
          id: `step:${s}`,
          lane: "Steps",
          label: `Step ${s + 1}`,
          start: at,
          length: p.stepLen[s],
          follows: s > 0 ? `step:${s - 1}` : undefined,
          beats: { ripple: COL_GAP },
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
