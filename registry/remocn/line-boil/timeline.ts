import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The outline drawing itself in, then the fill popping in under it. The boil
// keeps cycling drawings for the whole clip and is not an element. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LineBoilElementId = "draw" | "fill";

/** The scene's timing does not depend on its props. */
export type LineBoilTimingProps = object;

const DRAW_END = 22;
const FILL_START = 28;
/** The frame the fill has popped in, at speed 1. */
export const FILL_END = 40;

export const lineBoilTimeline = defineTimeline<
  LineBoilElementId,
  LineBoilTimingProps
>((): TimelineElement<LineBoilElementId>[] => [
  {
    id: "draw",
    lane: "Outline",
    label: "outline draws in",
    start: 0,
    length: DRAW_END,
  },
  {
    id: "fill",
    lane: "Fill",
    label: "fill pops in",
    start: FILL_START,
    length: FILL_END - FILL_START,
    follows: "draw",
  },
]);
