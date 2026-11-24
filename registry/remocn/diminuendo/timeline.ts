import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number rising in, the label sliding in, then the count climbing from
// `from` to `value` with each new place being born as the count reaches it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type DiminuendoElementId =
  | "intro"
  | "label"
  | "count"
  | `place:${number}`;

export interface DiminuendoTimingProps {
  value?: number;
  from?: number;
  /** Frames the count takes to climb from `from` to `value`. */
  countDuration?: number;
}

export const COUNT_LEN = 64;
const INTRO_LEN = 14;
const COUNT_AT = 8;
const BIRTH_LEN = 10;
const LABEL_AT = 4;
const LABEL_LEN = 18;

// The count's easing, `Easing.bezier(0.33, 0.05, 0.2, 1)` from Remotion,
// written out so the schedule can find the frame the count reaches each
// place without importing Remotion. Same algorithm, same numbers.
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

const easeCount = cubicBezier(0.33, 0.05, 0.2, 1);

export function placesOf(v: number) {
  return Math.max(1, Math.floor(Math.log10(Math.max(1, v))) + 1);
}

// `intro` rises the number in and `label` slides the label in. `count` climbs
// the number over its length. `place:<p>` is the place `p` (the 10^p digit)
// being born, from the frame the count first reaches 10^p; places the count
// starts with have no element.
export const diminuendoTimeline = defineTimeline<
  DiminuendoElementId,
  DiminuendoTimingProps
>(({ value = 860000, from = 0, countDuration = COUNT_LEN }) => {
  const lo = Math.max(0, Math.round(Math.min(from, value)));
  const hi = Math.max(0, Math.round(value));
  const logLo = Math.log10(lo + 1);
  const logHi = Math.log10(hi + 1);
  const valueAt = (f: number) => {
    const p = easeCount(
      Math.min(1, Math.max(0, (f - COUNT_AT) / countDuration)),
    );
    if (p >= 1) return hi;
    return Math.round(10 ** (logLo + (logHi - logLo) * p) - 1);
  };
  const birthOf = (p: number) => {
    if (p === 0 || placesOf(lo) > p) return Number.NEGATIVE_INFINITY;
    for (let f = COUNT_AT; f <= COUNT_AT + countDuration; f += 0.5) {
      if (valueAt(f) >= 10 ** p) return f;
    }
    return COUNT_AT + countDuration;
  };

  const elements: TimelineElement<DiminuendoElementId>[] = [
    {
      id: "intro",
      lane: "Number",
      label: "Intro",
      start: 0,
      length: INTRO_LEN,
    },
    {
      id: "label",
      lane: "Label",
      label: "Label",
      start: LABEL_AT,
      length: LABEL_LEN,
    },
    {
      id: "count",
      lane: "Number",
      label: "Count",
      start: COUNT_AT,
      length: countDuration,
    },
  ];
  const births: TimelineElement<DiminuendoElementId>[] = [];
  for (let p = 0; p < placesOf(hi); p++) {
    const b = birthOf(p);
    if (!Number.isFinite(b)) continue;
    births.push({
      id: `place:${p}`,
      lane: "Places",
      label: String(10 ** p),
      start: b,
      length: BIRTH_LEN,
    });
  }
  births.sort((a, b) => a.start - b.start);
  return [...elements, ...births];
});
