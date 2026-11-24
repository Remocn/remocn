import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The headline tracking open, the subject rising in front of it, the slow
// push and the caption. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type DepthHeadlineElementId = "open" | "rise" | "push" | "caption";

export interface DepthHeadlineTimingProps {
  riseFrames?: number;
}

const RISE_FRAMES = 44;
/** The headline tracks open over `OPEN`. */
const OPEN = 54;
/** The subject starts rising at `RISE_AT`. */
const RISE_AT = 4;
/** The push runs from `PUSH_AT` to `PUSH_END`. */
const PUSH_AT = 30;
const PUSH_END = 96;
/** The caption fades in from `CAPTION_AT` to `CAPTION_END`. */
const CAPTION_AT = 46;
const CAPTION_END = 62;

export const depthHeadlineTimeline = defineTimeline<
  DepthHeadlineElementId,
  DepthHeadlineTimingProps
>(({ riseFrames = RISE_FRAMES }): TimelineElement<DepthHeadlineElementId>[] => [
  { id: "open", lane: "Headline", label: "Track open", start: 0, length: OPEN },
  {
    id: "rise",
    lane: "Subject",
    label: "Rise",
    start: RISE_AT,
    length: riseFrames,
  },
  {
    id: "push",
    lane: "Camera",
    label: "Push",
    start: PUSH_AT,
    length: PUSH_END - PUSH_AT,
  },
  {
    id: "caption",
    lane: "Caption",
    label: "Caption",
    start: CAPTION_AT,
    length: CAPTION_END - CAPTION_AT,
  },
]);
