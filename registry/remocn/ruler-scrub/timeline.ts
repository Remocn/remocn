import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ruler scrub: the ruler fading in, the scrub easing along to the last
// value (lighting the centre mark and flashing as it lands), the slow sheen
// across the hero, the ruler lifting away as the value grows into the hero,
// the label rising in and the hero's slow push. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type RulerScrubElementId =
  | "enter"
  | "scrub"
  | "sheen"
  | "lift"
  | "label"
  | "push";

export interface RulerScrubTimingProps {
  scrubLength?: number;
}

const SCRUB_END = 70;

// `scrub` runs the ruler to the last value over its length, then rings into
// place. Its `litAt`/`lit` (the centre mark lighting) and `flashAt`/
// `flashPeak`/`flash` (the landing flash) are counted from the scrub's END.
// `sheen`, `lift` and `label` follow the scrub; `push` follows the lift.
export const rulerScrubTimeline = defineTimeline<
  RulerScrubElementId,
  RulerScrubTimingProps
>(({ scrubLength = SCRUB_END }): TimelineElement<RulerScrubElementId>[] => [
  { id: "enter", lane: "Ruler", label: "fade in", start: 0, length: 10 },
  {
    id: "scrub",
    lane: "Ruler",
    label: "scrub",
    start: 0,
    length: scrubLength,
    beats: { litAt: -4, lit: 2, flashAt: -2, flashPeak: 1, flash: 14 },
  },
  {
    id: "sheen",
    lane: "Hero",
    label: "sheen",
    start: scrubLength,
    length: 110,
    follows: "scrub",
  },
  {
    id: "lift",
    lane: "Ruler",
    label: "lift",
    start: scrubLength + 6,
    length: 32,
    follows: "scrub",
  },
  {
    id: "label",
    lane: "Label",
    label: "label",
    start: scrubLength + 30,
    length: 24,
    follows: "scrub",
  },
  {
    id: "push",
    lane: "Hero",
    label: "push",
    start: scrubLength + 38,
    length: 72,
    follows: "lift",
  },
]);
