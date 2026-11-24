import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The five lamps coming on one by one, then lights out: the headline slamming
// in, the dark row rising to sit above it, and the ground glow coming back.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type LightsOutElementId = `light:${number}` | "slam" | "out" | "glow";

export interface LightsOutTimingProps {
  beat?: number;
  hold?: number;
}

export const LIGHT_BEAT = 10;
export const LIGHT_HOLD = 24;

const FIRST_LIGHT = 10;
const LAMPS = 5;
/** Frames a lamp takes to warm the ground glow a step more. */
const WARM = 6;
const SLAM_LEN = 5;
/** The slam's clock starts this many frames before lights out. */
const SLAM_LEAD = 1;
const RISE_LEN = 9;
const GLOW_AT = 4;
const GLOW_LEN = 26;

// `light:<i>` is lamp `i` coming on: it stays lit until the next lamp (the
// last one until lights out), and `warm` is how long it takes to warm the
// glow. The lamps form a chain. `out` is lights out, the row rising above the
// headline; the slam starts a frame before it and the ground glow comes back
// after it. The slow push of the row runs from the first frame to `out`.
export const lightsOutTimeline = defineTimeline<
  LightsOutElementId,
  LightsOutTimingProps
>(({ beat = LIGHT_BEAT, hold = LIGHT_HOLD }) => {
  const lastLight = FIRST_LIGHT + 4 * beat;
  const outAt = lastLight + hold;
  const elements: TimelineElement<LightsOutElementId>[] = Array.from(
    { length: LAMPS },
    (_, i): TimelineElement<LightsOutElementId> => ({
      id: `light:${i}`,
      lane: "Lights",
      label: `lamp ${i + 1}`,
      start: FIRST_LIGHT + i * beat,
      length: i < LAMPS - 1 ? beat : hold,
      follows: i > 0 ? `light:${i - 1}` : undefined,
      beats: { warm: WARM },
    }),
  );
  elements.push(
    {
      id: "slam",
      lane: "Headline",
      label: "slam",
      start: outAt - SLAM_LEAD,
      length: SLAM_LEN,
      follows: `light:${LAMPS - 1}`,
    },
    {
      id: "out",
      lane: "Lights",
      label: "lights out",
      start: outAt,
      length: RISE_LEN,
      follows: `light:${LAMPS - 1}`,
    },
    {
      id: "glow",
      lane: "Glow",
      label: "glow",
      start: outAt + GLOW_AT,
      length: GLOW_LEN,
      follows: "out",
    },
  );
  return elements;
});
