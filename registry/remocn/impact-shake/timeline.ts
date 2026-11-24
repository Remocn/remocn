import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The subject falling into the floor and the hit: squash, camera shake,
// colour split, flash and dust. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ImpactShakeElementId = "fall" | "hit";

export interface ImpactShakeTimingProps {
  impact?: number;
}

export const DEFAULT_IMPACT = 7;

// `hit` follows the fall and runs as long as the longest dust grain lives.
// Its beats: the colour split's length (`split`), the flash's peak
// (`flashPeak`) and its end (`flash`).
export const impactShakeTimeline = defineTimeline<
  ImpactShakeElementId,
  ImpactShakeTimingProps
>(({ impact = DEFAULT_IMPACT }): TimelineElement<ImpactShakeElementId>[] => [
  {
    id: "fall",
    lane: "Subject",
    label: "fall",
    start: 0,
    length: impact,
  },
  {
    id: "hit",
    lane: "Subject",
    label: "hit",
    start: impact,
    length: 20,
    follows: "fall",
    beats: { split: 2, flashPeak: 0.5, flash: 2.5 },
  },
]);
