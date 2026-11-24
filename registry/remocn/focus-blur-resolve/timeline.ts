import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line resolving out of a blur and blurring away at the end. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type FocusBlurResolveElementId = "enter" | "exit";

/** Frames the line takes to come into focus, and to leave. */
const ENTER = 23;
const EXIT = 16;

// The exit is timed to end with the scene. `length` here is the composition
// length in scene frames without `speed`, as the component has always read
// it, so a faster scene still leaves at the end of the composition's frames.
export const focusBlurResolveTimeline = defineTimeline<
  FocusBlurResolveElementId,
  object
>((_, { length }): TimelineElement<FocusBlurResolveElementId>[] => {
  const exitStart = Math.max(ENTER, length - EXIT);
  return [
    { id: "enter", lane: "Text", label: "In", start: 0, length: ENTER },
    {
      id: "exit",
      lane: "Text",
      label: "Out",
      start: exitStart,
      length: length - exitStart,
      follows: "enter",
    },
  ];
});
