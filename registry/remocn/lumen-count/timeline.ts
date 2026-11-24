import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The count climbing and brightening, the eyebrow fading in near its end,
// the flare as it lands and the label rising after. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LumenCountElementId = "count" | "eyebrow" | "flare" | "label";

export interface LumenCountTimingProps {
  countFrames?: number;
}

const COUNT_AT = 6;
const COUNT_END = 58;
const FLARE_AT = 56;
const LABEL_AT = 68;
const SHIFT = 8;

// `count` climbs over its length; each time the number gains a character
// the line re-centres over `shift`. `flare` rises over `rise`, then fades
// from `fadeFrom` to its end. The eyebrow, the flare and the label follow
// the count.
export const lumenCountTimeline = defineTimeline<
  LumenCountElementId,
  LumenCountTimingProps
>(({ countFrames = COUNT_END - COUNT_AT }) => {
  const countEnd = COUNT_AT + countFrames;
  const flareAt = FLARE_AT + countEnd - COUNT_END;
  const labelAt = LABEL_AT + countEnd - COUNT_END;
  const elements: TimelineElement<LumenCountElementId>[] = [
    {
      id: "count",
      lane: "Number",
      label: "Count",
      start: COUNT_AT,
      length: countFrames,
      beats: { shift: SHIFT },
    },
    {
      id: "eyebrow",
      lane: "Copy",
      label: "Eyebrow",
      start: countEnd - 10,
      length: 18,
      follows: "count",
    },
    {
      id: "flare",
      lane: "Number",
      label: "Flare",
      start: flareAt,
      length: 24,
      follows: "count",
      beats: { rise: 5, fadeFrom: 6 },
    },
    {
      id: "label",
      lane: "Copy",
      label: "Label",
      start: labelAt,
      length: 18,
      follows: "count",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
