import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The distribution shift: the axis drawing in under its ticks, the bars
// rising and the curve stroking across them, the marker and its readout
// coming up, then the curve morphing from `before` to `after` while the
// camera closes in, and the readout landing with a kick. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type DistributionShiftElementId =
  | "axis"
  | "bars"
  | "curve"
  | "push"
  | "ticks"
  | "marker"
  | "shift"
  | "closer"
  | "land";

export interface DistributionShiftTimingProps {
  before?: number;
  after?: number;
  shiftDuration?: number;
}

export const DEFAULT_BEFORE = 840;
export const DEFAULT_AFTER = 120;

const AXIS = [-16, 14] as const;
const RISE = -4;
const MARK = [34, 48] as const;
const MORPH = [64, 116] as const;
const BINS = 96;

function niceStep(max: number) {
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return n * pow;
}

/** The value axis: its top and the tick values under the chart. */
export function distributionAxis(before: number, after: number) {
  const hi = Math.max(before, after);
  const step = niceStep(hi * 1.18);
  const axisMax = Math.ceil((hi * 1.12) / step) * step;
  const ticks = Array.from(
    { length: Math.round(axisMax / step) + 1 },
    (_, i) => i * step,
  );
  return { axisMax, ticks };
}

// `axis` draws the baseline over its length. `bars` raises bar `i` at
// `i` × `stagger` frames over `rise`; `curve` strokes the line across them.
// `push` is the slow camera push, ending 54 frames after the landing.
// `ticks` brings tick `i` in at `i` × `stagger`, its line over `line` and its
// number over `label`. `marker` raises the marker over its length, the
// readout tag from `tagAt` to `tag`. `shift` morphs the curve over its
// length, fading the ghost of the old curve in over `ghost`. `closer` is the
// camera closing in, following the shift; `land` kicks the readout at the
// shift's end and rises the delta under it from `deltaAt` to `delta`.
export const distributionShiftTimeline = defineTimeline<
  DistributionShiftElementId,
  DistributionShiftTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    after = DEFAULT_AFTER,
    shiftDuration = MORPH[1] - MORPH[0],
  }): TimelineElement<DistributionShiftElementId>[] => {
    const hit = MORPH[0] + shiftDuration;
    const { ticks } = distributionAxis(before, after);
    return [
      {
        id: "axis",
        lane: "Axis",
        label: "axis",
        start: AXIS[0],
        length: AXIS[1] - AXIS[0],
      },
      {
        id: "bars",
        lane: "Chart",
        label: "bars",
        start: RISE,
        length: (BINS - 1) * 0.3 + 16,
        beats: { stagger: 0.3, rise: 16 },
      },
      {
        id: "curve",
        lane: "Curve",
        label: "curve",
        start: RISE + 2,
        length: 38,
      },
      { id: "push", lane: "Camera", label: "push", start: 0, length: hit + 54 },
      {
        id: "ticks",
        lane: "Axis",
        label: "ticks",
        start: 4,
        length: (ticks.length - 1) * 2 + 12,
        beats: { stagger: 2, line: 10, label: 12 },
      },
      {
        id: "marker",
        lane: "Marker",
        label: "marker",
        start: MARK[0],
        length: MARK[1] - MARK[0],
        beats: { tagAt: 6, tag: MARK[1] - MARK[0] + 8 },
      },
      {
        id: "shift",
        lane: "Chart",
        label: "shift",
        start: MORPH[0],
        length: shiftDuration,
        beats: { ghost: 14 },
      },
      {
        id: "closer",
        lane: "Camera",
        label: "close in",
        start: MORPH[0] + 16,
        length: hit + 44 - (MORPH[0] + 16),
        follows: "shift",
      },
      {
        id: "land",
        lane: "Marker",
        label: "land",
        start: hit,
        length: 22,
        follows: "shift",
        beats: { deltaAt: 4, delta: 22 },
      },
    ];
  },
);
