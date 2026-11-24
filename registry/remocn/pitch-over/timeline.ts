import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number standing upright on its ruler, fading up and counting while
// the ruler fills; then the whole block pitches over flat, and the label
// fades in under it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PitchOverElementId = "enter" | "count" | "pitch" | "label";

export interface PitchOverTimingProps {
  countLength?: number;
}

const ENTER_END = 10;
export const COUNT_END = 46;
/** The pitch starts this long before the count ends. */
const PITCH_LEAD = 4;
const PITCH_LEN = 34;
/** The label fades in this long before the pitch ends. */
const LABEL_LEAD = 6;
const LABEL = 16;

// `count` runs the number and the ruler's fill; `pitch` follows it,
// overlapping its last frames, and `label` follows the pitch.
export const pitchOverTimeline = defineTimeline<
  PitchOverElementId,
  PitchOverTimingProps
>(({ countLength = COUNT_END }) => {
  const pitchAt = countLength - PITCH_LEAD;
  const labelAt = pitchAt + PITCH_LEN - LABEL_LEAD;
  const elements: TimelineElement<PitchOverElementId>[] = [
    { id: "enter", lane: "Block", label: "enter", start: 0, length: ENTER_END },
    {
      id: "count",
      lane: "Count",
      label: "count",
      start: 0,
      length: countLength,
    },
    {
      id: "pitch",
      lane: "Block",
      label: "pitch over",
      start: pitchAt,
      length: PITCH_LEN,
      follows: "count",
    },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: labelAt,
      length: LABEL,
      follows: "pitch",
    },
  ];
  return elements;
});
