import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line drawn through the old words, then the swap to the new ones.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type StrikethroughReplaceElementId = "strike" | "swap";

/** The scene's timing does not depend on its props. */
export type StrikethroughReplaceTimingProps = object;

/** The strike runs to this share of the scene; the swap from there to `SWAP_END`. */
const STRIKE_END = 0.4;
const SWAP_END = 0.6;

// `length` here is the composition length in scene frames without `speed`,
// as the component has always read it.
export const strikethroughReplaceTimeline = defineTimeline<
  StrikethroughReplaceElementId,
  StrikethroughReplaceTimingProps
>((_, { length }): TimelineElement<StrikethroughReplaceElementId>[] => [
  {
    id: "strike",
    lane: "Strike",
    label: "strike",
    start: 0,
    length: length * STRIKE_END,
  },
  {
    id: "swap",
    lane: "Swap",
    label: "swap",
    start: length * STRIKE_END,
    length: length * SWAP_END - length * STRIKE_END,
    follows: "strike",
  },
]);
