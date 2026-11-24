import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When the highlighted words turn from the base color to the highlight
// color. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type InlineHighlightElementId = "highlight";

/** The scene's timing does not depend on its props. */
export type InlineHighlightTimingProps = object;

/** The color shift runs between these shares of the scene. */
const FROM = 0.2;
const TO = 0.7;

// `length` here is the composition length in scene frames without `speed`,
// as the component has always read it.
export const inlineHighlightTimeline = defineTimeline<
  InlineHighlightElementId,
  InlineHighlightTimingProps
>((_, { length }): TimelineElement<InlineHighlightElementId>[] => [
  {
    id: "highlight",
    lane: "Highlight",
    label: "highlight",
    start: length * FROM,
    length: length * TO - length * FROM,
  },
]);
