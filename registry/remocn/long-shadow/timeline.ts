import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The mark popping in, its shadow growing out and the light swinging the
// shadow round. Frames on the 30 fps scene timeline, after `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type LongShadowElementId = "pop" | "grow" | "swing";

/** The scene's timing does not depend on its props. */
export type LongShadowTimingProps = object;

/** Frames until the light has settled. */
export const SHADOW_LENGTH = 48;

// `grow` and `swing` end where the shadow is fully out and where the swing
// settles; the springs run free past them.
export const longShadowTimeline = defineTimeline<
  LongShadowElementId,
  LongShadowTimingProps
>((): TimelineElement<LongShadowElementId>[] => [
  { id: "pop", lane: "Mark", label: "mark pops in", start: 0, length: 7 },
  {
    id: "grow",
    lane: "Shadow",
    label: "shadow grows",
    start: 7,
    length: 15,
    follows: "pop",
  },
  {
    id: "swing",
    lane: "Shadow",
    label: "light swings",
    start: 24,
    length: SHADOW_LENGTH - 24,
    follows: "grow",
  },
]);
