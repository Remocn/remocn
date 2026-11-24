import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ring fading and spinning in until it settles into its cruise. The
// cruise spin and the wobble run for as long as the scene does and are not
// elements. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type RingTextElementId = "entrance";

/** The scene's timing does not depend on its props. */
export type RingTextTimingProps = object;

/** The ring settles over `ENTRANCE` and fades in over its first `FADE`. */
export const ENTRANCE = 30;
export const FADE = 12;

export const ringTextTimeline = defineTimeline<
  RingTextElementId,
  RingTextTimingProps
>((): TimelineElement<RingTextElementId>[] => [
  {
    id: "entrance",
    lane: "Ring",
    label: "entrance",
    start: 0,
    length: ENTRANCE,
    beats: { fade: FADE },
  },
]);
