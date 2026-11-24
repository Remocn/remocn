import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One "scroll" climbing the paragraph while a soft front lights it word by
// word, the plain words settling a step back, and the slow drift after.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type ScrubRevealElementId = "scroll" | "settle" | "drift";

export interface ScrubRevealTimingProps {
  scrub?: number;
}

const SCROLL_START = 4;
const SCROLL_END = 122;
/** Frames the reveal front takes to cross the text by default. */
export const SCRUB = SCROLL_END - SCROLL_START;
const SETTLE_START = 118;
const SETTLE_END = 142;
/** Frames the page keeps drifting after the scroll stops. */
const DRIFT = 90;

// The settle starts a little before the scroll ends and the drift right as
// it ends; both follow the scroll.
export const scrubRevealTimeline = defineTimeline<
  ScrubRevealElementId,
  ScrubRevealTimingProps
>(({ scrub = SCRUB }) => {
  const late = scrub - SCRUB;
  const elements: TimelineElement<ScrubRevealElementId>[] = [
    {
      id: "scroll",
      lane: "Scroll",
      label: "scroll",
      start: SCROLL_START,
      length: SCROLL_END + late - SCROLL_START,
    },
    {
      id: "settle",
      lane: "Settle",
      label: "settle",
      start: SETTLE_START + late,
      length: SETTLE_END - SETTLE_START,
      follows: "scroll",
    },
    {
      id: "drift",
      lane: "Scroll",
      label: "drift",
      start: SCROLL_END + late,
      length: DRIFT,
      follows: "scroll",
    },
  ];
  return elements;
});
