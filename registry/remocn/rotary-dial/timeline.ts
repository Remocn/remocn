import { defineTimeline } from "@/lib/remocn/timeline";

// The camera settles in, the label and the value fade up, the hand grabs the
// knob and turns it from `from` to `to`, and the knob lands on its detent
// with a click, a bloom and a slow push. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type RotaryDialElementId =
  | "camera"
  | "label"
  | "value"
  | "grab"
  | "turn"
  | "land";

export interface RotaryDialTimingProps {
  turn?: number;
}

const GRAB_AT = 18;
const TURN_AT = 24;
/** Frames the knob turns for by default. */
export const DEFAULT_TURN = 48;

// The grab eases the knob in over its length and lets go `release` frames
// before the land (a negative beat). The light rises from the turn's start
// to `light` frames after the land; the land flashes the bloom up over
// `flash`, lets it ease back by `bloom` and pushes the camera in over its
// length.
export const rotaryDialTimeline = defineTimeline<
  RotaryDialElementId,
  RotaryDialTimingProps
>(({ turn = DEFAULT_TURN }) => {
  // The grab ramp eases off over the last 6 frames of the turn, so it needs more than 6.
  const turnLength = Math.max(7, turn);
  const land = TURN_AT + turnLength;
  return [
    {
      id: "camera",
      lane: "Camera",
      label: "Camera settles",
      start: 0,
      length: 54,
    },
    { id: "label", lane: "Copy", label: "Label", start: 6, length: 14 },
    { id: "value", lane: "Copy", label: "Value", start: 12, length: 14 },
    {
      id: "grab",
      lane: "Knob",
      label: "Grab",
      start: GRAB_AT,
      length: TURN_AT - GRAB_AT,
    },
    {
      id: "turn",
      lane: "Knob",
      label: "Turn",
      start: TURN_AT,
      length: turnLength,
      follows: "grab",
    },
    {
      id: "land",
      lane: "Knob",
      label: "Land",
      start: land,
      length: 60,
      follows: "turn",
      beats: { release: -6, light: 6, flash: 4, bloom: 40 },
    },
  ];
});
