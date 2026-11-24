import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The warp threads growing out from the middle, the counter fading in, each
// pick of the weft running across the cloth (row by row, from the top), and
// the finish: the cloth settling and the caption rising. The camera eases
// out over the whole weave. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type ThreadWeaveElementId =
  | "warp"
  | "stats"
  | "camera"
  | `pick:${number}`
  | "settle"
  | "caption";

export interface ThreadWeaveTimingProps {
  value?: string;
  motif?: "value" | "mark";
  weave?: number;
}

export const DEFAULT_VALUE = "24";

const FONT: Record<string, string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", ".#.##", "#..##"],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
};

/** The remocn.dev R mark, rasterised from its outline (13 × 12, ≥42% coverage). */
const MARK = [
  "1111111111..",
  ".1111111111.",
  ".........11.",
  "..........11",
  "..........11",
  ".........111",
  ".....111111.",
  ".111111111..",
  "11111111....",
  "11....111...",
  "11.....11...",
  "11......11..",
  "11.......11.",
];

/** Longest the weave may take, so dense motifs still hold their poster. */
export const WEAVE_BUDGET = 108;

export function motifBitmap(value: string, motif: "value" | "mark") {
  if (motif === "mark") return MARK;
  const rows: string[] = ["", "", "", "", "", "", ""];
  const chars = value.split("").filter((ch) => FONT[ch]);
  chars.forEach((ch, i) => {
    const g = FONT[ch];
    for (let r = 0; r < 7; r++) {
      rows[r] += g[r].replace(/#/g, "1") + (i < chars.length - 1 ? "." : "");
    }
  });
  return rows;
}

const WEAVE_START = 22;
export const PAD = { value: [3, 2], mark: [2, 1] } as const;
const BEAT = 7;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// The row pacing's easing, `Easing.bezier(0.22, 1, 0.36, 1)` from Remotion,
// written out because a schedule doesn't import Remotion. Same algorithm,
// same numbers.
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

const EASE_OUT = cubicBezier(0.22, 1, 0.36, 1);

/** The cloth's rows: two per bitmap pixel, with the padding. */
export function clothRows(value: string, motif: "value" | "mark") {
  const bitmap = motifBitmap(value, motif);
  const [, PAD_Y] = PAD[motif];
  return (bitmap.length + PAD_Y * 2) * 2;
}

// `warp` grows each warp thread over `grow`, the outer ones up to `spread`
// frames after the middle. `pick:<r>` runs the weft across row `r` over its
// length, the rows slowing less as they go, squeezed to fit `weave`; a
// chain. The row drops into place over `beat` after it lands. `settle` and
// `caption` follow the last pick; `camera` eases out until `settle` ends.
export const threadWeaveTimeline = defineTimeline<
  ThreadWeaveElementId,
  ThreadWeaveTimingProps
>(({ value = DEFAULT_VALUE, motif = "value", weave = WEAVE_BUDGET }) => {
  const rows = clothRows(value, motif);
  const durs: number[] = [];
  const starts: number[] = [];
  const raw = Array.from({ length: rows }, (_, r) =>
    lerp(6.6, 3.4, EASE_OUT(r / Math.max(1, rows - 1))),
  );
  const fit = Math.min(1, weave / raw.reduce((a, b) => a + b, 0));
  let acc = WEAVE_START;
  for (let r = 0; r < rows; r++) {
    const d = raw[r] * fit;
    starts.push(acc);
    durs.push(d);
    acc += d;
  }
  const weaveEnd = acc;
  const last: ThreadWeaveElementId = `pick:${rows - 1}`;
  const elements: TimelineElement<ThreadWeaveElementId>[] = [
    {
      id: "warp",
      lane: "Warp",
      label: "Warp",
      start: -6,
      length: 28,
      beats: { grow: 18, spread: 10 },
    },
    {
      id: "camera",
      lane: "Camera",
      label: "Camera",
      start: 0,
      length: weaveEnd + 16,
    },
    { id: "stats", lane: "Footer", label: "Counter", start: 10, length: 16 },
    ...starts.map(
      (s, r): TimelineElement<ThreadWeaveElementId> => ({
        id: `pick:${r}`,
        lane: "Weft",
        label: `Pick ${r + 1}`,
        start: s,
        length: durs[r],
        follows: r > 0 ? `pick:${r - 1}` : undefined,
        beats: { beat: BEAT },
      }),
    ),
    {
      id: "settle",
      lane: "Weft",
      label: "Settle",
      start: weaveEnd,
      length: 16,
      follows: last,
    },
    {
      id: "caption",
      lane: "Footer",
      label: "Caption",
      start: weaveEnd + 2,
      length: 16,
      follows: last,
    },
  ];
  return elements;
});
