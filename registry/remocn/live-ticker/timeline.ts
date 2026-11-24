import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The counter's columns rising in, the run at full rate with the streams
// feeding it, the brake, the freeze on `value` and the label rising under it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type LiveTickerElementId = "rise" | "run" | "brake" | "freeze" | "label";

export interface LiveTickerTimingProps {
  value?: number;
}

export const DEFAULT_VALUE = 12480312;

const BRAKE_AT = 70;
const FREEZE_AT = 104;
/** Column `i` rises from `i * STAGGER + COLUMN_AT` over `COLUMN`. */
const STAGGER = 1.5;
const COLUMN_AT = -14;
const COLUMN = 20;
const COMMA_AT = -13;
/** The band behind the number kicks in over this many frames. */
const KICK = 14;
const LIFT = 22;
const LABEL_AT = 2;
const LABEL_RISE = 20;

// `rise` lifts the columns into place one by one (they already tick), the
// commas a frame behind their column, and kicks the band in. `run` is the
// full rate; the streams spawn until it ends. `brake` slows the rate until
// `freeze`, which lifts the number over its length; the streams fade from
// `fadeAt` to `fadeEnd` and no hit lands after `lastHit`. `label` brings in
// the unit, the connector and the name at their beats.
export const liveTickerTimeline = defineTimeline<
  LiveTickerElementId,
  LiveTickerTimingProps
>(({ value = DEFAULT_VALUE }) => {
  const n = String(Math.max(0, Math.round(value))).length;
  const elements: TimelineElement<LiveTickerElementId>[] = [
    {
      id: "rise",
      lane: "Counter",
      label: "Columns rise",
      start: 0,
      length: (n - 1) * STAGGER + COLUMN_AT + COLUMN,
      beats: {
        at: COLUMN_AT,
        stagger: STAGGER,
        column: COLUMN,
        commaAt: COMMA_AT,
        kick: KICK,
      },
    },
    {
      id: "run",
      lane: "Rate",
      label: "Full rate",
      start: 0,
      length: BRAKE_AT,
    },
    {
      id: "brake",
      lane: "Rate",
      label: "Brake",
      start: BRAKE_AT,
      length: FREEZE_AT - BRAKE_AT,
      follows: "run",
    },
    {
      id: "freeze",
      lane: "Rate",
      label: "Freeze",
      start: FREEZE_AT,
      length: LIFT,
      follows: "brake",
      beats: { fadeAt: -12, fadeEnd: 16, lastHit: -8 },
    },
    {
      id: "label",
      lane: "Label",
      label: "Label",
      start: FREEZE_AT + LABEL_AT,
      length: 7 + LABEL_RISE,
      follows: "freeze",
      beats: { unit: 0, connector: 4, name: 7, rise: LABEL_RISE },
    },
  ];
  return elements;
});
