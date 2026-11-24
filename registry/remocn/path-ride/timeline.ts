import { defineTimeline } from "@/lib/remocn/timeline";

// The line drawing along the path with the text riding its head, the curve
// pulling straight under the text, and the line erasing from its start.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type PathRideElementId = "draw" | "straighten" | "erase";

/** Beats on the 30 fps clock: `[start, end]` of each element. */
export const PATH_RIDE_BEATS = {
  draw: [0, 40],
  straighten: [50, 68],
  erase: [52, 70],
} as const;

// The straightening and the erase both follow the draw.
export const pathRideTimeline = defineTimeline<PathRideElementId, object>(
  () => [
    {
      id: "draw",
      lane: "Line",
      label: "Line draws",
      start: PATH_RIDE_BEATS.draw[0],
      length: PATH_RIDE_BEATS.draw[1] - PATH_RIDE_BEATS.draw[0],
    },
    {
      id: "straighten",
      lane: "Text",
      label: "Curve straightens",
      start: PATH_RIDE_BEATS.straighten[0],
      length: PATH_RIDE_BEATS.straighten[1] - PATH_RIDE_BEATS.straighten[0],
      follows: "draw",
    },
    {
      id: "erase",
      lane: "Line",
      label: "Line erases",
      start: PATH_RIDE_BEATS.erase[0],
      length: PATH_RIDE_BEATS.erase[1] - PATH_RIDE_BEATS.erase[0],
      follows: "draw",
    },
  ],
);
