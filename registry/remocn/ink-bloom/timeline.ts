import { defineTimeline } from "@/lib/remocn/timeline";

// A drop falls and meets the water, the ink blooms out of the impact, then
// the cloud thins while the lockup condenses out of it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type InkBloomElementId = "drop" | "bloom" | "thin" | "lockup";

export interface InkBloomTimingProps {
  resolveAt?: number;
}

/** Frame the drop meets the water. */
const IMPACT = 13;
const RESOLVE_AT = 100;

// The bloom's age counts from its start and runs until the cloud thins; the
// thinning and the lockup are both pinned to `resolveAt`.
export const inkBloomTimeline = defineTimeline<
  InkBloomElementId,
  InkBloomTimingProps
>(({ resolveAt = RESOLVE_AT }) => {
  const late = resolveAt - 100;
  return [
    {
      id: "drop",
      lane: "Ink",
      label: "Drop falls",
      start: 0,
      length: IMPACT,
    },
    {
      id: "bloom",
      lane: "Ink",
      label: "Ink blooms",
      start: IMPACT,
      length: Math.max(0, 92 + late - IMPACT),
      follows: "drop",
    },
    {
      id: "thin",
      lane: "Ink",
      label: "Cloud thins",
      start: 92 + late,
      length: 58,
    },
    {
      id: "lockup",
      lane: "Lockup",
      label: "Lockup condenses",
      start: 100 + late,
      length: 50,
    },
  ];
});
