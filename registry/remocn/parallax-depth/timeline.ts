import { defineTimeline } from "@/lib/remocn/timeline";

// The camera trucking sideways and pushing in through the layers, once.
// Frames on the 30 fps scene timeline, after `speed`. The id is public: a
// saved `timing` prop refers to it.

export type ParallaxDepthElementId = "move";

const MOVE = 60;

export const parallaxDepthTimeline = defineTimeline<
  ParallaxDepthElementId,
  object
>(() => [
  {
    id: "move",
    lane: "Camera",
    label: "truck and push",
    start: 0,
    length: MOVE,
  },
]);
