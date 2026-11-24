import { defineTimeline } from "@/lib/remocn/timeline";

// The dolly zoom: the camera moving in while the lens widens, once. Frames
// on the 30 fps scene timeline, after `speed`. The id is public: a saved
// `timing` prop refers to it.

export type DollyZoomElementId = "move";

const START = 4;
const MOVE = 32;

export const dollyZoomTimeline = defineTimeline<DollyZoomElementId, object>(
  () => [
    {
      id: "move",
      lane: "Camera",
      label: "dolly zoom",
      start: START,
      length: MOVE,
    },
  ],
);
