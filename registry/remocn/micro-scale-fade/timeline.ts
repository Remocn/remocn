import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line fading in from a touch smaller. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type MicroScaleFadeElementId = "text";

/** Frames the line takes to fade and scale in. */
const ENTER = 18;

export const microScaleFadeTimeline = defineTimeline<
  MicroScaleFadeElementId,
  object
>((): TimelineElement<MicroScaleFadeElementId>[] => [
  { id: "text", lane: "Text", label: "Text", start: 0, length: ENTER },
]);
