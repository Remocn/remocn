import { defineTimeline } from "@/lib/remocn/timeline";

// The bodies raining down and piling up until the heap goes to sleep, played
// back from a simulation recorded once. Frames on the 30 fps scene
// timeline, after `speed`. The id is public: a saved `timing` prop refers
// to it.

export type GravityPileElementId = "fall";

export interface GravityPileTimingProps {
  gravity?: number;
}

/** Frames the simulation records. */
export const FRAMES = 150;
/** The heap starts settling here at gravity 1, and sleeps this much later. */
export const SETTLE_FROM = 46;
export const SETTLE_FRAMES = 18;

// `fall` lasts until the heap sleeps; weaker gravity rains slower and
// settles later. Its `frames` beat is the recorded simulation, so
// stretching the element plays the simulation slower.
export const gravityPileTimeline = defineTimeline<
  GravityPileElementId,
  GravityPileTimingProps
>(({ gravity = 1 }) => [
  {
    id: "fall",
    lane: "Pile",
    label: "fall and settle",
    start: 0,
    length: Math.min(
      FRAMES,
      SETTLE_FROM / Math.sqrt(Math.max(0.2, gravity)) + SETTLE_FRAMES,
    ),
    beats: { frames: FRAMES },
  },
]);
