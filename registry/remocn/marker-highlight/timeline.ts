import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When the marker sweeps under the highlighted words. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type MarkerHighlightElementId = "marker";

/** The scene's timing does not depend on its props. */
export type MarkerHighlightTimingProps = object;

const MARKER_AT = 15;
/** Frames the marker's spring takes to settle. */
const MARKER = 21;

export const markerHighlightTimeline = defineTimeline<
  MarkerHighlightElementId,
  MarkerHighlightTimingProps
>((): TimelineElement<MarkerHighlightElementId>[] => [
  {
    id: "marker",
    lane: "Marker",
    label: "marker",
    start: MARKER_AT,
    length: MARKER,
  },
]);
