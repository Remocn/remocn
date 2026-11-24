import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The streak igniting, crossing the frame to reveal the lockup behind it, and
// the trail it leaves glowing on. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type AnamorphicFlareElementId = "ignite" | "cross" | "residual";

const IGNITE = 6;
const CROSS_START = 4;
const CROSS_END = 26;

// `ignite` powers the streak up; it stretches out over `grow`. `cross` sweeps
// the head across the frame and fades the streak from `fade` to `fadeEnd`.
// `residual` brings the leftover trail line up. Each follows the one before.
export const anamorphicFlareTimeline = defineTimeline<
  AnamorphicFlareElementId,
  object
>(() => {
  const elements: TimelineElement<AnamorphicFlareElementId>[] = [
    {
      id: "ignite",
      lane: "Streak",
      label: "Ignite",
      start: 0,
      length: IGNITE,
      beats: { grow: 12 },
    },
    {
      id: "cross",
      lane: "Streak",
      label: "Cross",
      start: CROSS_START,
      length: CROSS_END - CROSS_START,
      follows: "ignite",
      beats: {
        fade: CROSS_END - 6 - CROSS_START,
        fadeEnd: CROSS_END + 2 - CROSS_START,
      },
    },
    {
      id: "residual",
      lane: "Trail",
      label: "Trail",
      start: CROSS_END - 2,
      length: 16,
      follows: "cross",
    },
  ];
  return elements;
});
