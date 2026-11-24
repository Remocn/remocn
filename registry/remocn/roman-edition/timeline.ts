import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The band opening, the first numeral and the labels rising in, each step of
// the count from one numeral to the next, and the tagline rising in word by
// word. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type RomanEditionElementId =
  | "band"
  | "intro"
  | `step:${number}`
  | `word:${number}`;

export interface RomanEditionTimingProps {
  value?: number;
  from?: number;
  tagline?: string;
  stagger?: number;
}

export const DEFAULT_VALUE = 14;
export const DEFAULT_FROM = 1;
export const DEFAULT_TAGLINE = "Five days of new scenes, one every morning.";
const STAGGER = 3;

const START = 16;
const SLOW = 8;
const FAST = 3.5;
const MOVE = 10;

/** The values the count shows, every one when few, in round steps when many. */
export function sequence(from: number, to: number): number[] {
  const a = Math.max(1, Math.round(Math.min(from, to)));
  const b = Math.max(1, Math.round(to));
  if (b - a <= 15) {
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  const out: number[] = [];
  for (let v = a; v <= Math.min(b, a + 4); v++) out.push(v);
  const steps = [5, 10, 50, 100, 500, 1000];
  const unit = steps.find((u) => (b - a) / u <= 9) ?? 1000;
  let v = Math.ceil((out[out.length - 1] + 1) / unit) * unit;
  while (v < b) {
    out.push(v);
    v += unit;
  }
  out.push(b);
  return out;
}

/** The tagline as the words that rise in. */
export function taglineWords(tagline: string) {
  return tagline ? tagline.split(" ") : [];
}

// `step:<k>` shows value `k` of the sequence, until the next step: the
// numerals change over `move` frames (or the step's length, when shorter).
// The first steps are slow, the middle fast, the last slow again. `intro`
// lifts the first numeral and the labels in around the first step. The
// tagline words are a chain that follows the last step.
export const romanEditionTimeline = defineTimeline<
  RomanEditionElementId,
  RomanEditionTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    from = DEFAULT_FROM,
    tagline = DEFAULT_TAGLINE,
    stagger = STAGGER,
  }) => {
    const seq = sequence(from, value);
    const times: number[] = [];
    let at = START;
    const n = seq.length;
    for (let k = 0; k < n; k++) {
      times.push(at);
      const p = n > 1 ? k / (n - 1) : 1;
      const u = Math.abs(p - 0.5) * 2;
      const gap = k < 3 ? SLOW + 1 : FAST + (SLOW - FAST) * u ** 2.2;
      at += gap;
    }
    const lastAt = times[times.length - 1];
    const tagAt = lastAt + 8;
    const elements: TimelineElement<RomanEditionElementId>[] = [
      { id: "band", lane: "Band", label: "Band", start: 0, length: 16 },
      {
        id: "intro",
        lane: "Labels",
        label: "Intro",
        start: START - 8,
        length: 16,
      },
      ...times.map(
        (T, k): TimelineElement<RomanEditionElementId> => ({
          id: `step:${k}`,
          lane: "Numeral",
          label: String(seq[k]),
          start: T,
          length: k < times.length - 1 ? times[k + 1] - T : MOVE + 4,
          follows: k > 0 ? `step:${k - 1}` : undefined,
          beats: { move: MOVE },
        }),
      ),
      ...taglineWords(tagline).map(
        (w, i): TimelineElement<RomanEditionElementId> => ({
          id: `word:${i}`,
          lane: "Tagline",
          label: w,
          start: tagAt + i * stagger,
          length: 16,
          follows: i > 0 ? `word:${i - 1}` : `step:${times.length - 1}`,
        }),
      ),
    ];
    return elements;
  },
);
