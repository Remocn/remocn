import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure fading in, the caption rising, and the count running from
// `from` to `value`. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ChurnCountElementId = "enter" | "label" | "count";

export interface ChurnCountTimingProps {
  /** Frames the count takes from `from` to `value`. */
  duration?: number;
}

const COUNT_AT = 8;
const COUNT_END = 84;
const LABEL_AT = 3;
/** Frames a digit takes to recover its weight after it changes. */
const RECOVER = 13;

// `enter` is the figure fading in and `label` the caption rising. `count`
// is the count itself; a digit that changes thins out and recovers over
// `recover`.
export const churnCountTimeline = defineTimeline<
  ChurnCountElementId,
  ChurnCountTimingProps
>(({ duration = COUNT_END - COUNT_AT }) => {
  const out: TimelineElement<ChurnCountElementId>[] = [
    { id: "enter", lane: "Figure", label: "enter", start: 0, length: 10 },
    {
      id: "label",
      lane: "Caption",
      label: "caption",
      start: LABEL_AT,
      length: 18,
    },
    {
      id: "count",
      lane: "Figure",
      label: "count",
      start: COUNT_AT,
      length: duration,
      beats: { recover: RECOVER },
    },
  ];
  return out;
});
