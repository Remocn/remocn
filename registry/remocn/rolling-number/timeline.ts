import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The count rolling from `from` to `to`. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type RollingNumberElementId = "count";

/** Share of the scene the count takes; the rest holds the final number. */
const COUNT_PORTION = 0.8;

// The count is timed against the scene. `length` here is the composition
// length in scene frames without `speed`, as the component has always read
// it. A higher place fades in as the count reaches it, so it has no element
// of its own.
export const rollingNumberTimeline = defineTimeline<
  RollingNumberElementId,
  object
>((_, { length }): TimelineElement<RollingNumberElementId>[] => [
  {
    id: "count",
    lane: "Number",
    label: "Count",
    start: 0,
    length: length * COUNT_PORTION,
  },
]);
