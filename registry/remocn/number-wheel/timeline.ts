import { defineTimeline } from "@/lib/remocn/timeline";

// When the wheels count from `from` to `to`. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type NumberWheelElementId = "count";

/** The scene's timing depends only on its length. */
export type NumberWheelTimingProps = object;

/** Share of the scene the count runs over; the rest holds the final value. */
const COUNT_PORTION = 0.8;

export const numberWheelTimeline = defineTimeline<
  NumberWheelElementId,
  NumberWheelTimingProps
>((_, { length }) => [
  {
    id: "count",
    lane: "Count",
    label: "count",
    start: 0,
    length: length * COUNT_PORTION,
  },
]);
