import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The beam searching the stage, swinging past the lockup, landing on it and
// the house lights coming up. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type SpotlightElementId = "search" | "swing" | "land" | "house";

const SEARCH = 12;
const SWING = 26;
const HOUSE = 38;

// `search` switches the beam on over `on` and drifts it left of the lockup.
// `swing` throws it past the lockup; `land` springs it back onto it and lets
// the lockup brighten past the beam from `lift`. `house` brings the house
// lights up. Each follows the one before.
export const spotlightTimeline = defineTimeline<SpotlightElementId, object>(
  () => {
    const elements: TimelineElement<SpotlightElementId>[] = [
      {
        id: "search",
        lane: "Beam",
        label: "Search",
        start: 0,
        length: SEARCH,
        beats: { on: 5 },
      },
      {
        id: "swing",
        lane: "Beam",
        label: "Swing",
        start: SEARCH,
        length: SWING - SEARCH,
        follows: "search",
      },
      {
        id: "land",
        lane: "Beam",
        label: "Land",
        start: SWING,
        length: HOUSE - SWING,
        follows: "swing",
        beats: { lift: 10 },
      },
      {
        id: "house",
        lane: "House lights",
        label: "House lights",
        start: HOUSE,
        length: 12,
        follows: "land",
      },
    ];
    return elements;
  },
);
