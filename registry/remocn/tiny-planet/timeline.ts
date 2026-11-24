import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type TinyPlanetElementId = "bend" | "spin";

const BEND_START = 8;
const BEND_END = 40;
const SPIN_RAMP = 14;

// The flat skyline bends into a planet; the spin eases in over the last
// frames of the bend, then turns at a steady rate to the end.
export const tinyPlanetTimeline = defineTimeline<TinyPlanetElementId, object>(
  (): TimelineElement<TinyPlanetElementId>[] => [
    {
      id: "bend",
      lane: "Planet",
      label: "Bend",
      start: BEND_START,
      length: BEND_END - BEND_START,
    },
    {
      id: "spin",
      lane: "Spin",
      label: "Spin up",
      start: BEND_END - SPIN_RAMP,
      length: SPIN_RAMP,
      follows: "bend",
    },
  ],
);
