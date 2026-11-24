import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The frame fading in under a slow push, the rods drawing and the beads
// dropping in row by row, the count stepping up to `value` (each step
// sliding its beads across) and the label. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type AbacusCountElementId =
  | "frame"
  | "push"
  | "rods"
  | "beads"
  | `step:${number}`
  | "label";

export interface AbacusCountTimingProps {
  value?: number;
}

export const BEADS = 9;
const START = 16;
const TICK = 5;
const CARRY_DELAY = 3;
const MID = [0.37, 0.58, 0.46, 0.63, 0.52];

export function digitAt(v: number, place: number) {
  return Math.floor(v / 10 ** place) % 10;
}

/** The value shown, clamped to six digits, and how many rods it takes. */
export function abacusTarget(value: number) {
  const target = Math.max(0, Math.min(999999, Math.round(value)));
  return { target, places: Math.max(3, String(target).length) };
}

/** The values the count steps through, and the frame each one lands. */
export function buildSteps(value: number, places: number) {
  const seq: number[] = [0];
  const add = (v: number) => {
    if (v > seq[seq.length - 1] && v <= value) seq.push(v);
  };
  for (const v of [3, 6, 9, 10]) add(v);
  for (let pl = 2; pl < places; pl++) {
    const top = 10 ** pl;
    add(Math.round(top * MID[pl % MID.length]));
    add(top - 1);
    add(top);
  }
  add(value);
  const times: number[] = [START];
  let clock = START;
  for (let k = 1; k < seq.length; k++) {
    const prog = (k - 1) / Math.max(1, seq.length - 2);
    // `interpolate(prog, [0, 1], [9, 5])`, as Remotion computes it.
    let gap = ((prog - 0) / (1 - 0)) * (5 - 9) + 9;
    let carry = false;
    for (let pl = 0; pl < places; pl++) {
      if (digitAt(seq[k], pl) < digitAt(seq[k - 1], pl)) carry = true;
    }
    if (carry) gap += 4;
    if (k === seq.length - 1 && k > 1) gap += 6;
    clock += gap;
    times.push(clock);
  }
  return { seq, times };
}

// Rod `row` draws from `rods.start + row * stagger` over `each`; bead `i`
// of row `row` drops in from `beads.start + row * row + i * bead` over
// `each`. `step:<k>` lands value `k` of the count: its digits tick over
// `tick`, its beads slide one after another `bead` frames apart, and a
// place that fills after a carry waits `carry` frames. The steps form a
// chain; the label follows the last one and fades in after its `in` beat.
export const abacusCountTimeline = defineTimeline<
  AbacusCountElementId,
  AbacusCountTimingProps
>(({ value = 48216 }): TimelineElement<AbacusCountElementId>[] => {
  const { target, places } = abacusTarget(value);
  const { seq, times } = buildSteps(target, places);
  const lastAt = times[times.length - 1];
  return [
    { id: "frame", lane: "Frame", label: "fade in", start: 0, length: 16 },
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: 0,
      length: lastAt + 40,
    },
    {
      id: "rods",
      lane: "Frame",
      label: "rods",
      start: 2,
      length: (places - 1) * 2 + 16,
      beats: { stagger: 2, each: 16 },
    },
    {
      id: "beads",
      lane: "Beads",
      label: "beads",
      start: 6,
      length: (places - 1) * 2 + (BEADS - 1) * 0.6 + 8,
      beats: { row: 2, bead: 0.6, each: 8 },
    },
    ...seq.map(
      (v, k): TimelineElement<AbacusCountElementId> => ({
        id: `step:${k}`,
        lane: "Count",
        label: String(v),
        start: times[k],
        length: k < times.length - 1 ? times[k + 1] - times[k] : TICK,
        follows: k > 0 ? `step:${k - 1}` : undefined,
        beats: { tick: TICK, carry: CARRY_DELAY, bead: 0.7 },
      }),
    ),
    {
      id: "label",
      lane: "Copy",
      label: "label",
      start: lastAt,
      length: 24,
      follows: `step:${seq.length - 1}`,
      beats: { in: 6 },
    },
  ];
});
