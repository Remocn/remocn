import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number rising in digit by digit with its point and unit, the label
// sliding up, then each prefix step: the point hopping over three digits,
// the unit swapping to the next prefix and the leading zeros folding away.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type PointHopElementId =
  | `digit:${number}`
  | "point"
  | "label"
  | "unit"
  | `step:${number}`;

export interface PointHopTimingProps {
  value?: number;
  unit?: string;
  prefixes?: string[];
  /** Frames for the point to hop over one digit. */
  hop?: number;
  /** Frames the number rests between prefix steps. */
  rest?: number;
}

export const DEFAULT_VALUE = 0.0000342;
export const DEFAULT_UNIT = "s";
export const DEFAULT_PREFIXES = ["", "m", "µ", "n"];
export const HOP_LEN = 7;
export const STEP_REST = 12;

const RISE_GAP = 1.6;
const RISE_LEN = 16;
const LABEL_AT = 6;
const LABEL_LEN = 16;
const FIRST_STEP = 34;
const HOP_GAP = 1;
const SWAP_LEN = 12;
const FOLD_LEN = 14;

export interface Plan {
  digits: string[];
  start: number;
  steps: number;
  foldAfter: number[];
  pointLeaves: boolean;
}

export function plan(value: number, maxSteps: number): Plan {
  const v = Math.max(0, Math.abs(value));
  let s = v.toFixed(12).replace(/0+$/, "");
  if (s.endsWith(".")) s = s.slice(0, -1);
  const [intPart, frac = ""] = s.split(".");
  let steps = 0;
  let scaled = v;
  while (scaled > 0 && scaled < 1 && steps < maxSteps) {
    scaled *= 1000;
    steps++;
  }
  const end = intPart.length + steps * 3;
  const digits = Array.from(intPart + frac);
  while (digits.length < end) digits.push("0");
  const foldAfter = digits.map(() => -1);
  for (let k = 1; k <= steps; k++) {
    const slot = intPart.length + k * 3;
    let i = 0;
    while (i < slot - 1 && digits[i] === "0") {
      if (foldAfter[i] < 0) foldAfter[i] = k;
      i++;
    }
  }
  return {
    digits,
    start: intPart.length,
    steps,
    foldAfter,
    pointLeaves: end >= digits.length && steps > 0,
  };
}

/** The prefixes the number can step through, one empty one when there are none. */
export function prefixesOf(prefixes: string[]) {
  return prefixes.length > 0 ? prefixes : [""];
}

// `digit:<i>` rises into place, `RISE_GAP` after the one before it (a chain);
// `point` rises with the digit right after it and `unit` after the last
// digit. `label` slides up on its own. `step:<k>` moves the number to prefix
// `k`, lasting until the next step (the steps form a chain): the point hops
// over a digit every `hopEvery` frames, each hop taking `hop`; the unit swaps
// from `swapAt` over `swap`, and the digits that fold on this step (with the
// point, on the last step when it leaves) fold from `foldAt` over `fold`.
export const pointHopTimeline = defineTimeline<
  PointHopElementId,
  PointHopTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    unit = DEFAULT_UNIT,
    prefixes = DEFAULT_PREFIXES,
    hop = HOP_LEN,
    rest = STEP_REST,
  }) => {
    const pre = prefixesOf(prefixes);
    const p = plan(value, pre.length - 1);
    const rises: TimelineElement<PointHopElementId>[] = [];
    p.digits.forEach((d, i) => {
      rises.push({
        id: `digit:${i}`,
        lane: "Digits",
        label: d,
        start: i * RISE_GAP,
        length: RISE_LEN,
        follows: i > 0 ? `digit:${i - 1}` : undefined,
      });
    });
    const point: TimelineElement<PointHopElementId> = {
      id: "point",
      lane: "Point",
      label: ".",
      start: p.start * RISE_GAP,
      length: RISE_LEN,
      follows: p.start > 0 ? `digit:${p.start - 1}` : undefined,
    };
    const unitEl: TimelineElement<PointHopElementId> = {
      id: "unit",
      lane: "Unit",
      label: unit,
      start: (p.digits.length + 1) * RISE_GAP,
      length: RISE_LEN,
      follows: p.digits.length > 0 ? `digit:${p.digits.length - 1}` : undefined,
    };
    const label: TimelineElement<PointHopElementId> = {
      id: "label",
      lane: "Label",
      label: "Label",
      start: LABEL_AT,
      length: LABEL_LEN,
    };
    // Rises in time order, the point after the digit that starts with it.
    const intro = [...rises];
    intro.splice(Math.min(p.start + 1, intro.length), 0, point);
    intro.push(unitEl);
    const at = intro.findIndex((e) => e.start > LABEL_AT);
    intro.splice(at < 0 ? intro.length : at, 0, label);

    const stepLen = 3 * (hop + HOP_GAP) + FOLD_LEN + rest;
    const hopsEnd = 3 * (hop + HOP_GAP) - HOP_GAP;
    const steps: TimelineElement<PointHopElementId>[] = [];
    for (let k = 1; k <= p.steps; k++) {
      steps.push({
        id: `step:${k}`,
        lane: "Steps",
        label: `${pre[k]}${unit}`,
        start: FIRST_STEP + (k - 1) * stepLen,
        length: stepLen,
        follows: k > 1 ? `step:${k - 1}` : undefined,
        beats: {
          hop,
          hopEvery: hop + HOP_GAP,
          swapAt: hopsEnd - 6,
          swap: SWAP_LEN,
          foldAt: hopsEnd - 2,
          fold: FOLD_LEN,
        },
      });
    }
    return [...intro, ...steps];
  },
);
