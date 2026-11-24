import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The horizon line draws across while the name fades in below it, the name
// climbs through the line, the line settles a touch lower and the tagline
// comes in under it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type FirstLightElementId = "line" | "name" | "climb" | "set" | "tagline";

export interface FirstLightTimingProps {
  rise?: number;
}

const APPEAR_LEN = 12;
const CLIMB_AT = 10;
const CLIMB_LEN = 54;
const TAG_AT = 60;

// `line` draws the horizon line and its ticks across over its length.
// `name` fades the name in and lifts it the last few pixels. `climb` raises
// the name through the line over its length. `set` lets the line settle
// lower over its length, from 14 frames before the climb ends. `tagline`
// fades the tagline in.
export const firstLightTimeline = defineTimeline<
  FirstLightElementId,
  FirstLightTimingProps
>(({ rise = CLIMB_LEN }): TimelineElement<FirstLightElementId>[] => [
  { id: "line", lane: "Horizon", label: "Line", start: 0, length: 14 },
  { id: "name", lane: "Name", label: "Fade in", start: 0, length: APPEAR_LEN },
  { id: "climb", lane: "Name", label: "Climb", start: CLIMB_AT, length: rise },
  {
    id: "set",
    lane: "Horizon",
    label: "Settle",
    start: CLIMB_AT + rise - 14,
    length: 36,
    follows: "climb",
  },
  {
    id: "tagline",
    lane: "Tagline",
    label: "Tagline",
    start: TAG_AT,
    length: 16,
  },
]);
