import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The title rising into its clip, the label rising in above it, and the
// title cooling from the accent to the ink. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type CoolDownElementId = "rise" | "label" | "cool";

export interface CoolDownTimingProps {
  cooldown?: number;
}

const RISE_LEN = 14;
const LABEL_AT = 4;
const LABEL_LEN = 16;
const COOL_AT = 16;
const COOL_END = 86;
const STILL_AT = 92;
/** Frames the title takes to cool, by default. */
export const COOLDOWN = COOL_END - COOL_AT;

// The cool's `still` beat is when the heat shimmer switches off for good.
export const coolDownTimeline = defineTimeline<
  CoolDownElementId,
  CoolDownTimingProps
>(({ cooldown = COOLDOWN }) => {
  const coolEnd = COOL_AT + cooldown;
  const elements: TimelineElement<CoolDownElementId>[] = [
    { id: "rise", lane: "Title", label: "rise", start: 0, length: RISE_LEN },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: LABEL_AT,
      length: LABEL_LEN,
    },
    {
      id: "cool",
      lane: "Title",
      label: "cool down",
      start: COOL_AT,
      length: cooldown,
      beats: { still: STILL_AT + (coolEnd - COOL_END) - COOL_AT },
    },
  ];
  return elements;
});
