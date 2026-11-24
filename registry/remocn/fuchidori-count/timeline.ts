import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure rising in, the vertical label, the count climbing on a log
// scale, and an ink ring for each power of ten the count passes. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type FuchidoriCountElementId =
  | "rise"
  | "label"
  | "count"
  | `ring:${number}`;

export interface FuchidoriCountTimingProps {
  value?: number;
  from?: number;
  maxBorders?: number;
  countLength?: number;
}

const RISE_AT = 0;
const RISE_LEN = 14;
const LABEL_AT = 6;
const LABEL_LEN = 18;
const COUNT_AT = 8;
export const COUNT_LEN = 68;
const RING_LEN = 12;

// The count's easing, `Easing.bezier(0.3, 0.1, 0.3, 1)` from Remotion,
// written out so the schedule can find the frame the count passes each
// power of ten without importing Remotion. Same algorithm, same numbers.
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
export const easeCount = cubicBezier(0.3, 0.1, 0.3, 1);

/** The count's range in log10 and the powers of ten that get a ring. */
export function countRange(value: number, from: number, maxBorders: number) {
  const end = Math.max(1, Math.floor(value));
  const start = Math.min(end, Math.max(1, Math.floor(from)));
  const lo = Math.log10(start);
  const hi = Math.log10(end);
  const powers: number[] = [];
  for (let k = Math.floor(lo) + 1; k <= Math.floor(hi); k++) powers.push(k);
  const shown = powers.slice(-Math.max(0, Math.floor(maxBorders)));
  return { start, end, lo, hi, shown };
}

// `ring:<j>` starts on the frame the count passes the `j`th ringed power
// of ten and grows its ring over its length; the figure presses in for
// `press`, easing off over `pressFade`. The rings follow the count.
export const fuchidoriCountTimeline = defineTimeline<
  FuchidoriCountElementId,
  FuchidoriCountTimingProps
>(
  ({
    value = 4096,
    from = 1,
    maxBorders = 4,
    countLength = COUNT_LEN,
  }): TimelineElement<FuchidoriCountElementId>[] => {
    const { lo, hi, shown } = countRange(value, from, maxBorders);
    const crossAt = (k: number) => {
      const target = hi === lo ? 1 : (k - lo) / (hi - lo);
      let a = 0;
      let b = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (a + b) / 2;
        if (easeCount(mid) < target) a = mid;
        else b = mid;
      }
      return COUNT_AT + b * countLength;
    };
    return [
      {
        id: "rise",
        lane: "Figure",
        label: "rise",
        start: RISE_AT,
        length: RISE_LEN,
      },
      {
        id: "label",
        lane: "Label",
        label: "label",
        start: LABEL_AT,
        length: LABEL_LEN,
      },
      {
        id: "count",
        lane: "Figure",
        label: "count",
        start: COUNT_AT,
        length: countLength,
      },
      ...shown.map(
        (k, j): TimelineElement<FuchidoriCountElementId> => ({
          id: `ring:${j}`,
          lane: "Rings",
          label: `10^${k}`,
          start: crossAt(k),
          length: RING_LEN,
          follows: "count",
          beats: { press: 10, pressFade: 14 },
        }),
      ),
    ];
  },
);
