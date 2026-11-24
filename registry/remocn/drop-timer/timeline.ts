import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The clock punching in, each counted second cutting to the next digit
// with a flash, a bump and a shake, 00:00:00 holding, the smash through the
// lens, LIVE NOW slamming in, then the brand and the url rising. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type DropTimerElementId =
  | "enter"
  | `tick:${number}`
  | "smash"
  | "live"
  | "brand"
  | "url";

export interface DropTimerTimingProps {
  from?: number;
  tick?: number;
  hold?: number;
}

export const FROM = 5;
export const TICK = 14;
export const ZERO_HOLD = 8;

const START = 6;
const FADE_IN = 2;
const FLASH = 1;
const RUSH = 5;
const CLOCK_OUT_AT = 2;
const CLOCK_OUT = 3;
const FLASH_PEAK = 1;
const FLASH_OUT = 5;
const CLOCK_GONE = 6;
const HIT = 4;
const DRIFT = 70;
const LIVE_AT = 1;
const LIVE = 7;
const LIVE_FADE = 2;
const HAZE = 24;
const BRAND_AT = 7;
const URL_AT = 11;
const RISE = 16;

/** Seconds counted: `from` rounded, at least one. */
export const secondsOf = (from: number) => Math.max(1, Math.round(from));

// `enter` punches the clock in, fading in over `fade`. `tick:<k>` is the
// k-th counted second: a `flash` frame and the cut to the next digit; the
// ticks form a chain, and the last one (the cut to zero) holds for `hold`.
// `smash` rushes the clock past the lens over its length: it fades from
// `clockOutAt` over `clockOut` and is gone at `gone`, the screen flashes up
// to `flashPeak` and back by `flashOut`, the camera takes a hit at `hit`,
// the payoff gradient drifts over `drift`. `live` slams LIVE NOW in, fading
// over `fade` and raising the haze over `haze`; `brand` and `url` rise after
// it. Each element follows the one before.
export const dropTimerTimeline = defineTimeline<
  DropTimerElementId,
  DropTimerTimingProps
>(({ from = FROM, tick = TICK, hold = ZERO_HOLD }) => {
  const total = secondsOf(from);
  const zeroAt = START + total * tick;
  const smashAt = zeroAt + hold;
  const elements: TimelineElement<DropTimerElementId>[] = [
    {
      id: "enter",
      lane: "Clock",
      label: "punch in",
      start: 0,
      length: START,
      beats: { fade: FADE_IN },
    },
  ];
  for (let k = 1; k <= total; k++) {
    elements.push({
      id: `tick:${k}`,
      lane: "Clock",
      label: String(total - k),
      start: START + k * tick,
      length: k === total ? hold : tick,
      follows: k > 1 ? `tick:${k - 1}` : "enter",
      beats: { flash: FLASH },
    });
  }
  elements.push(
    {
      id: "smash",
      lane: "Clock",
      label: "smash",
      start: smashAt,
      length: RUSH,
      follows: `tick:${total}`,
      beats: {
        clockOutAt: CLOCK_OUT_AT,
        clockOut: CLOCK_OUT,
        gone: CLOCK_GONE,
        flashPeak: FLASH_PEAK,
        flashOut: FLASH_OUT,
        hit: HIT,
        drift: DRIFT,
      },
    },
    {
      id: "live",
      lane: "Payoff",
      label: "live",
      start: smashAt + LIVE_AT,
      length: LIVE,
      follows: "smash",
      beats: { fade: LIVE_FADE, haze: HAZE },
    },
    {
      id: "brand",
      lane: "Payoff",
      label: "brand",
      start: smashAt + BRAND_AT,
      length: RISE,
      follows: "live",
    },
    {
      id: "url",
      lane: "Url",
      label: "url",
      start: smashAt + URL_AT,
      length: RISE,
      follows: "brand",
    },
  );
  return elements;
});
