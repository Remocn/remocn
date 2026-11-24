import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Three accent bars sweep in from the left while the headline drifts the
// other way inside them, widen and merge into one slab, hold, then break
// back into thin bars that park as a mark beside the headline. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type StripeMaskElementId =
  | "sweep"
  | "drift"
  | "beam"
  | "widen"
  | "retract";

export interface StripeMaskTimingProps {
  /** Frames between the three bars as they sweep in. */
  stagger?: number;
  /** Frames the full slab holds before it breaks back into bars. */
  hold?: number;
}

/** The sweep is already under way at frame 0 (negative). */
const SWEEP_AT = -6;
const SWEEP_LEN = 46;
const SWEEP_STAGGER = 5;
const DRIFT_LEN = 52;
const BEAM_LEN = 120;
const WIDEN_AT = 44;
const WIDEN_LEN = 13;
const WIDEN_STAGGER = 2;
const RETRACT_AT = 70;
const RETRACT_LEN = 24;
const RETRACT_STAGGER = 3;
const HOLD = 10;

// `sweep`, `widen` and `retract` move the three bars, each bar over `bar`,
// `stagger` apart (the sweep leads with the rightmost bar, the widen with
// the middle one, the retreat with the leftmost). `drift` slides the
// headline inside the bars; `beam` raises the light over the shot. The slab
// holds between `widen` and `retract`.
export const stripeMaskTimeline = defineTimeline<
  StripeMaskElementId,
  StripeMaskTimingProps
>(({ stagger = SWEEP_STAGGER, hold = HOLD }) => {
  const retractAt = RETRACT_AT - HOLD + hold;
  const elements: TimelineElement<StripeMaskElementId>[] = [
    {
      id: "sweep",
      lane: "Bars",
      label: "sweep in",
      start: SWEEP_AT,
      length: 2 * stagger + SWEEP_LEN,
      beats: { stagger, bar: SWEEP_LEN },
    },
    {
      id: "drift",
      lane: "Headline",
      label: "drift",
      start: SWEEP_AT,
      length: DRIFT_LEN,
    },
    {
      id: "beam",
      lane: "Beam",
      label: "beam rise",
      start: 0,
      length: BEAM_LEN,
    },
    {
      id: "widen",
      lane: "Bars",
      label: "merge",
      start: WIDEN_AT,
      length: WIDEN_STAGGER + WIDEN_LEN,
      follows: "sweep",
      beats: { stagger: WIDEN_STAGGER, bar: WIDEN_LEN },
    },
    {
      id: "retract",
      lane: "Bars",
      label: "break into mark",
      start: retractAt,
      length: 2 * RETRACT_STAGGER + RETRACT_LEN,
      follows: "widen",
      beats: { stagger: RETRACT_STAGGER, bar: RETRACT_LEN },
    },
  ];
  return elements;
});
