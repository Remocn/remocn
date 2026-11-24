import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The counter punching in, the reels racing down to ten, the low-stock tag
// flashing, ten hard ticks down to zero, "0" holding, the SOLD OUT band
// slamming across and the subline rising. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SoldOutElementId =
  | "enter"
  | "race"
  | "warning"
  | `tick:${number}`
  | "zero"
  | "band"
  | "subline";

export interface SoldOutTimingProps {
  stock?: number;
  hold?: number;
}

const ENTER_LEN = 9;
const RACE_AT = 10;
const RACE_END = 56;
const TICK = 3;
export const LOW = 10;
export const ZERO_HOLD = 6;
const BAND_LEN = 6;

/** The stock as counted: a whole number, at least one. */
export function totalOf(stock: number) {
  return Math.max(1, Math.round(stock));
}

// The counter punches in (enter; it shows over `show` frames, the unit fades
// in over `unit` from `unitAt`). The race runs the reels down to the low
// mark; `tick:<k>` is the k-th hard tick from there, a chain, each rolling
// its reel over `roll` frames. The warning tag pops over `pop` frames and
// blinks every `flicker` frames for its length. "0" holds (zero), then the
// band slams across over its length: the tremble drops over `calm`, the
// counter sinks behind it from `behindAt` over `behind`, the tag goes at
// `tagOff` and the gradient drifts over `drift`. The subline follows.
export const soldOutTimeline = defineTimeline<
  SoldOutElementId,
  SoldOutTimingProps
>(({ stock = 128, hold = ZERO_HOLD }) => {
  const total = totalOf(stock);
  const low = Math.min(LOW, total);
  const zeroAt = RACE_END + low * TICK;
  const bandAt = zeroAt + hold;
  const elements: TimelineElement<SoldOutElementId>[] = [
    {
      id: "enter",
      lane: "Counter",
      label: "punch in",
      start: 0,
      length: ENTER_LEN,
      beats: { show: 2, unitAt: 2, unit: 6 },
    },
    {
      id: "race",
      lane: "Counter",
      label: `race to ${low}`,
      start: RACE_AT,
      length: RACE_END - RACE_AT,
    },
    {
      id: "warning",
      lane: "Tag",
      label: "low stock",
      start: RACE_END,
      length: 24,
      follows: "race",
      beats: { pop: 4, flicker: 4 },
    },
    ...Array.from(
      { length: low },
      (_, k): TimelineElement<SoldOutElementId> => ({
        id: `tick:${k}`,
        lane: "Counter",
        label: String(low - k - 1),
        start: RACE_END + k * TICK,
        length: TICK,
        follows: k > 0 ? `tick:${k - 1}` : "race",
        beats: { roll: 2 },
      }),
    ),
    {
      id: "zero",
      lane: "Counter",
      label: "hold at zero",
      start: zeroAt,
      length: hold,
      follows: `tick:${low - 1}`,
    },
    {
      id: "band",
      lane: "Band",
      label: "sold out",
      start: bandAt,
      length: BAND_LEN,
      follows: "zero",
      beats: { calm: 4, behindAt: 1, behind: 8, tagOff: 4, drift: 70 },
    },
    {
      id: "subline",
      lane: "Subline",
      label: "subline",
      start: bandAt + 12,
      length: 18,
      follows: "band",
    },
  ];
  return elements;
});
