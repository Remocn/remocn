import { defineTimeline } from "@/lib/remocn/timeline";

// The text closing its tracking and coming out of the blur. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TrackingInElementId = "enter";

export interface TrackingInTimingProps {
  text: string;
}

/** Frames the tracking spring takes to settle. */
const SETTLE = 21;
/** Frames the text takes to fade in. */
const FADE = 15;

// The spring runs from the start of `enter`; the fade is its first beat.
export const trackingInTimeline = defineTimeline<
  TrackingInElementId,
  TrackingInTimingProps
>(({ text }) => [
  {
    id: "enter",
    lane: "Text",
    label: text,
    start: 0,
    length: SETTLE,
    beats: { fade: FADE },
  },
]);
