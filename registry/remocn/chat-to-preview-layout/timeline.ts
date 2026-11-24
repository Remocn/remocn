import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The chat column narrowing while the preview slides in beside it. Frames on
// the 30 fps scene timeline, after `speed`. The id is public: a saved
// `timing` prop refers to it.

export type ChatToPreviewLayoutElementId = "morph";

/** The morph spans fixed shares of the clip, not of the props. */
export type ChatToPreviewLayoutTimingProps = object;

// `length` here is the clip length without `speed`: the morph runs from 10%
// to 70% of the clip.
export const chatToPreviewLayoutTimeline = defineTimeline<
  ChatToPreviewLayoutElementId,
  ChatToPreviewLayoutTimingProps
>((_props, { length }): TimelineElement<ChatToPreviewLayoutElementId>[] => {
  const morphStart = length * 0.1;
  const morphEnd = length * 0.7;
  return [
    {
      id: "morph",
      lane: "Layout",
      label: "chat to preview",
      start: morphStart,
      length: morphEnd - morphStart,
    },
  ];
});
