import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The typing dots pulsing twice, the dots stretching into a bar and a period
// while the camera eases out, the bar sweeping across to reveal the word, and
// the period landing with the camera's slow push. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type EllipsisResolveElementId =
  | `pulse:${number}`
  | "resolve"
  | "sweep"
  | "land";

export interface EllipsisResolveTimingProps {
  resolveAt?: number;
  sweepFrames?: number;
}

const PULSE_A = 2;
const PULSE_B = 20;
const BUMP = 11;
const BUMP_STEP = 4;
export const STRETCH = 40;
const STRETCH_LEN = 20;
export const SWEEP = 58;
export const SWEEP_LEN = 26;
export const RISE = 13;
const SETTLE = 10;
const PUSH = 40;

// A pulse bumps each dot in turn: dot `k` rises over `bump` frames from
// `start + k * step`. In the resolve, `zoomIn` and `zoomOut` bound the
// camera's ease out, `accent` is when dot 3 starts taking the accent, and
// dot `k` stretches over `stretch` frames from `start + (2 - k) * stagger`.
// The sweep's `closeGap` closes the gap to the period and `rise` is how long
// a letter takes to rise once the bar's edge clears it. The land's `settle`
// beats time the period's pop; its length is the camera's push. The sweep
// follows the resolve, the land follows the sweep.
export const ellipsisResolveTimeline = defineTimeline<
  EllipsisResolveElementId,
  EllipsisResolveTimingProps
>(({ resolveAt = STRETCH, sweepFrames = SWEEP_LEN }) => {
  const sweepAt = SWEEP + (resolveAt - STRETCH);
  const landAt = sweepAt + sweepFrames;
  const elements: TimelineElement<EllipsisResolveElementId>[] = [
    ...[PULSE_A, PULSE_B].map(
      (start, k): TimelineElement<EllipsisResolveElementId> => ({
        id: `pulse:${k}`,
        lane: "Dots",
        label: `Pulse ${k + 1}`,
        start,
        length: BUMP + 2 * BUMP_STEP,
        beats: { step: BUMP_STEP, bump: BUMP },
      }),
    ),
    {
      id: "resolve",
      lane: "Dots",
      label: "Dots stretch",
      start: resolveAt,
      length: STRETCH_LEN,
      beats: {
        zoomIn: -6,
        zoomOut: STRETCH_LEN + 6,
        accent: 4,
        stagger: 2,
        stretch: STRETCH_LEN - 4,
      },
    },
    {
      id: "sweep",
      lane: "Word",
      label: "Bar sweeps",
      start: sweepAt,
      length: sweepFrames,
      follows: "resolve",
      beats: { closeGap: 10, rise: RISE },
    },
    {
      id: "land",
      lane: "Word",
      label: "Period lands",
      start: landAt,
      length: PUSH,
      follows: "sweep",
      beats: { settleLead: -2, settle: SETTLE },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
