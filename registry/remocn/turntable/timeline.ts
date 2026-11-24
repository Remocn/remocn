import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The card's spin on the turntable. Frames on the 30 fps scene timeline,
// after `speed`. The id is public: a saved `timing` prop refers to it.

export type TurntableElementId = "spin";

/** The scene's timing does not depend on its props. */
export type TurntableTimingProps = object;

const START = 6;
const END = 64;

export const turntableTimeline = defineTimeline<
  TurntableElementId,
  TurntableTimingProps
>((): TimelineElement<TurntableElementId>[] => [
  {
    id: "spin",
    lane: "Card",
    label: "spin",
    start: START,
    length: END - START,
  },
]);
