import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure fading up, the eyebrow, the count down from `from` (each digit
// the figure loses closing its slot) and the label. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type WeightCutElementId =
  | "enter"
  | "eyebrow"
  | "count"
  | `drop:${number}`
  | "label";

export interface WeightCutTimingProps {
  value?: number;
  from?: number;
  decimals?: number;
  count?: number;
}

const ENTER_AT = -5;
const ENTER_END = 14;
const COUNT_AT = 20;
const COUNT_END = 78;
const LABEL_AT = 64;

// The count's easing, `Easing.bezier(0.3, 0, 0.12, 1)` from Remotion,
// written out so the schedule can find the frames the figure loses a digit
// without importing Remotion. Same algorithm, same numbers.
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
const coefA = (a1: number, a2: number) => 1.0 - 3.0 * a2 + 3.0 * a1;
const coefB = (a1: number, a2: number) => 3.0 * a2 - 6.0 * a1;
const coefC = (a1: number) => 3.0 * a1;
const calcBezier = (t: number, a1: number, a2: number) =>
  ((coefA(a1, a2) * t + coefB(a1, a2)) * t + coefC(a1)) * t;
const getSlope = (t: number, a1: number, a2: number) =>
  3.0 * coefA(a1, a2) * t * t + 2.0 * coefB(a1, a2) * t + coefC(a1);

function cubicBezier(mX1: number, mY1: number, mX2: number, mY2: number) {
  const samples = new Float32Array(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    samples[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }
  const tForX = (aX: number) => {
    let intervalStart = 0.0;
    let current = 1;
    const last = kSplineTableSize - 1;
    for (; current !== last && samples[current] <= aX; ++current) {
      intervalStart += kSampleStepSize;
    }
    --current;
    const dist =
      (aX - samples[current]) / (samples[current + 1] - samples[current]);
    const guess = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guess, mX1, mX2);
    if (initialSlope >= 0.001) {
      let t = guess;
      for (let i = 0; i < 4; ++i) {
        const slope = getSlope(t, mX1, mX2);
        if (slope === 0.0) return t;
        t -= (calcBezier(t, mX1, mX2) - aX) / slope;
      }
      return t;
    }
    if (initialSlope === 0.0) return guess;
    let aA = intervalStart;
    let aB = intervalStart + kSampleStepSize;
    let t = 0;
    let x = 0;
    let i = 0;
    do {
      t = aA + (aB - aA) / 2.0;
      x = calcBezier(t, mX1, mX2) - aX;
      if (x > 0.0) aB = t;
      else aA = t;
    } while (Math.abs(x) > 0.0000001 && ++i < 10);
    return t;
  };
  return (x: number) => {
    const clamped = Math.min(1, Math.max(0, x));
    if (clamped === 0) return 0;
    if (clamped === 1) return 1;
    return calcBezier(tForX(clamped), mY1, mY2);
  };
}

/** How the count eases from `from` to `value`. */
export const easeCount = cubicBezier(0.3, 0, 0.12, 1);

/** Digits before the point once `v` is rounded to `decimals`. */
function intDigits(v: number, decimals: number) {
  const shown = Math.round(Math.abs(v) * 10 ** decimals) / 10 ** decimals;
  return Math.max(1, Math.floor(shown).toString().length);
}

// `enter` starts before the scene, so frame 0 is already part-way in.
// `count` runs from `from` to `value`; the digit widths relax to their
// natural set over its last `relax` frames. `drop:<j>` is the moment the
// figure loses its `j`th digit and the slot springs closed (the spring
// keeps its own pace; the length is about how long it takes). The drops
// follow the count. The label keeps its own time.
export const weightCutTimeline = defineTimeline<
  WeightCutElementId,
  WeightCutTimingProps
>(
  ({
    value = 6.8,
    from = 94,
    decimals = 1,
    count = COUNT_END - COUNT_AT,
  }): TimelineElement<WeightCutElementId>[] => {
    const countEnd = COUNT_AT + count;
    const drops: { at: number }[] = [];
    let prev = intDigits(from, decimals);
    for (let f = COUNT_AT; f <= countEnd; f += 0.25) {
      const g = easeCount((f - COUNT_AT) / (countEnd - COUNT_AT));
      const d = intDigits(from + (value - from) * g, decimals);
      if (d < prev) {
        for (let k = prev; k > d; k--) drops.push({ at: f });
        prev = d;
      }
    }
    const elements: TimelineElement<WeightCutElementId>[] = [
      {
        id: "enter",
        lane: "Figure",
        label: "enter",
        start: ENTER_AT,
        length: ENTER_END - ENTER_AT,
      },
      { id: "eyebrow", lane: "Copy", label: "eyebrow", start: 2, length: 16 },
      {
        id: "count",
        lane: "Figure",
        label: "count",
        start: COUNT_AT,
        length: count,
        beats: { relax: 10 },
      },
      ...drops.map(
        (d, j): TimelineElement<WeightCutElementId> => ({
          id: `drop:${j}`,
          lane: "Digits",
          label: `digit ${j + 1}`,
          start: d.at,
          length: 20,
          follows: "count",
        }),
      ),
      {
        id: "label",
        lane: "Copy",
        label: "label",
        start: LABEL_AT,
        length: 18,
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
