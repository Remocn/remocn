import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ascent read-out: the labels and numbers rising in, the speed and
// altitude racing up (the vehicle dot riding the trajectory), the slow
// ground drift, the Max Q band wiping across with the marker dropping on the
// trajectory, and the status settling under the numbers. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type MaxQElementId =
  | "intro"
  | "race"
  | "drift"
  | "band"
  | "marker"
  | "status";

export interface MaxQTimingProps {
  bandHold?: number;
}

const RACE_END = 112;
const MAXQ_AT = 60;
const BAND_IN = 6;
const BAND_HOLD = 22;
const BAND_OUT = 7;

// `race` climbs the numbers over its length; at its end the numbers kick
// over `settle`. `band` wipes in over `in`, holds for `hold` and wipes out
// over `out`; its flash kicks `hitAt` frames in over `hit`, its text slides
// in from `textAt` over `text`, and the ground brightens over `glow`.
// `marker` drops on the trajectory with the band; `status` follows the band,
// starting a frame before it is gone.
export const maxQTimeline = defineTimeline<MaxQElementId, MaxQTimingProps>(
  ({ bandHold = BAND_HOLD }): TimelineElement<MaxQElementId>[] => [
    { id: "intro", lane: "Read-out", label: "rise in", start: -3, length: 10 },
    {
      id: "race",
      lane: "Read-out",
      label: "climb",
      start: 0,
      length: RACE_END,
      beats: { settle: 8 },
    },
    { id: "drift", lane: "Ground", label: "drift", start: 0, length: 150 },
    {
      id: "band",
      lane: "Band",
      label: "Max Q",
      start: MAXQ_AT,
      length: BAND_IN + bandHold + BAND_OUT,
      beats: {
        in: BAND_IN,
        hold: bandHold,
        out: BAND_OUT,
        hitAt: 2,
        hit: 8,
        textAt: 2,
        text: 8,
        glow: 20,
      },
    },
    {
      id: "marker",
      lane: "Trajectory",
      label: "marker",
      start: MAXQ_AT,
      length: 10,
    },
    {
      id: "status",
      lane: "Status",
      label: "status",
      start: MAXQ_AT + BAND_IN + bandHold + BAND_OUT - 1,
      length: 12,
      follows: "band",
    },
  ],
);
