import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line fading out and the second fading in after it. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type FadeThroughElementId = "exit" | "enter";

/** Frames the first line takes to leave, and the second to arrive. */
const EXIT = 8;
const ENTER = 13;
/** The second line starts `MICRO_DELAY` after the first has gone, less `OVERLAP`. */
const OVERLAP = 1;
const MICRO_DELAY = 2;

export const fadeThroughTimeline = defineTimeline<FadeThroughElementId, object>(
  (): TimelineElement<FadeThroughElementId>[] => [
    { id: "exit", lane: "Text", label: "From", start: 0, length: EXIT },
    {
      id: "enter",
      lane: "Text",
      label: "To",
      start: Math.max(0, EXIT - OVERLAP + MICRO_DELAY),
      length: ENTER,
      follows: "exit",
    },
  ],
);
