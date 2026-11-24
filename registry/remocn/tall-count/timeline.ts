import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure fading in, the label rising beside it, the figure counting up
// and growing, and the springy lift that stretches it taller as it lands.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type TallCountElementId = "enter" | "label" | "grow" | "lift";

export interface TallCountTimingProps {
  growDuration?: number;
}

const GROW_AT = 8;
const GROW_END = 66;
const LIFT_AT = 54;
const LABEL_AT = 2;

// `grow` counts the figure up and grows it over its length. `lift` springs
// the figure taller from its start, which follows `grow`, a little before
// its end (unless a very short grow puts it before the grow's start).
export const tallCountTimeline = defineTimeline<
  TallCountElementId,
  TallCountTimingProps
>(({ growDuration = GROW_END - GROW_AT }) => {
  const growEnd = GROW_AT + growDuration;
  const liftAt = growEnd - (GROW_END - LIFT_AT);
  const elements: TimelineElement<TallCountElementId>[] = [
    { id: "enter", lane: "Figure", label: "Enter", start: 0, length: 12 },
    { id: "label", lane: "Label", label: "Label", start: LABEL_AT, length: 18 },
    {
      id: "grow",
      lane: "Figure",
      label: "Grow",
      start: GROW_AT,
      length: growDuration,
    },
    {
      id: "lift",
      lane: "Lift",
      label: "Lift",
      start: liftAt,
      length: 30,
      follows: liftAt >= GROW_AT ? "grow" : undefined,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
