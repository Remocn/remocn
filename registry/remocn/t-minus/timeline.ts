import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The count rising in, the telemetry corners booting one after another,
// one hard cut per counted second, the bottom of the frame warming from
// T–3, T–0 firing the bloom, then the title slamming in and the subtitle.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type TMinusElementId =
  | "intro"
  | "telemetry"
  | `second:${number}`
  | "warm"
  | "zero"
  | "liftoff"
  | "subtitle";

export interface TMinusTimingProps {
  from?: number;
  beat?: number;
}

const FIRST = 14;

/** The second the clock starts from: a whole number, at least 1. */
export function startOf(from: number) {
  return Math.max(1, Math.floor(from));
}

// Telemetry corner `k` boots `k * stagger` frames into `telemetry`.
// `second:<k>` cuts the count to T–(from − 1 − k); each kicks the number
// for `snap` frames, and the seconds form a chain. `zero` is T–0: the
// number kicks again over `zeroSnap`, the bloom fires over `fire` and the
// white hit lands `hitAt` in for `hit`; it lasts until liftoff, which
// follows it. The title slams in over the liftoff's length and kicks from
// `hitAt` for `hit`; the subtitle follows it. The warmth starts three
// counted seconds before T–0 and lasts three.
export const tMinusTimeline = defineTimeline<
  TMinusElementId,
  TMinusTimingProps
>(({ from = 10, beat = 8 }): TimelineElement<TMinusElementId>[] => {
  const start = startOf(from);
  const zeroAt = FIRST + (start - 1) * beat;
  const liftAt = zeroAt + 3;
  const elements: TimelineElement<TMinusElementId>[] = [
    { id: "intro", lane: "Intro", label: "count in", start: -4, length: 10 },
    {
      id: "telemetry",
      lane: "Telemetry",
      label: "boot",
      start: 2,
      length: 3 * 2 + 5,
      beats: { stagger: 2 },
    },
    ...Array.from(
      { length: start - 1 },
      (_, k): TimelineElement<TMinusElementId> => ({
        id: `second:${k}`,
        lane: "Count",
        label: `T–${start - 1 - k}`,
        start: FIRST + k * beat,
        length: beat,
        follows: k > 0 ? `second:${k - 1}` : undefined,
        beats: { snap: 5 },
      }),
    ),
    {
      id: "warm",
      lane: "Bloom",
      label: "warm up",
      start: FIRST + (start - 3) * beat,
      length: 3 * beat,
    },
    {
      id: "zero",
      lane: "Count",
      label: "T–0",
      start: zeroAt,
      length: 3,
      follows: start > 1 ? `second:${start - 2}` : undefined,
      beats: { snap: 5, zeroSnap: 3, fire: 16, hitAt: 1, hit: 7 },
    },
    {
      id: "liftoff",
      lane: "Title",
      label: "title",
      start: liftAt,
      length: 8,
      follows: "zero",
      beats: { hitAt: 4, hit: 8 },
    },
    {
      id: "subtitle",
      lane: "Title",
      label: "subtitle",
      start: liftAt + 9,
      length: 10,
      follows: "liftoff",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
