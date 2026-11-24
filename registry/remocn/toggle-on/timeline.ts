import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera settling in, the knob being pressed and flipping on, the glow
// lighting up, then the label and the state word rising in. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type ToggleOnElementId =
  | "camera"
  | "press"
  | "flip"
  | "light"
  | "label"
  | "state";

export interface ToggleOnTimingProps {
  stagger?: number;
}

const CAMERA = 54;
const PRESS = 12;
const FLIP = 24;
/** The knob's squash relaxes this long after the flip. */
const RELAX = 6;
/** The label column opens over this span after the flip. */
const OPEN_AT = 2;
const OPEN_END = 26;
const LIGHT = 26;
const LIGHT_LEN = 30;
const LABEL = 34;
const STATE = 42;
const WORD = 14;

// `flip` runs until the label column is open (`openEnd`); its `relax`
// beat lets the squashed knob spring back. `state` follows `label`.
export const toggleOnTimeline = defineTimeline<
  ToggleOnElementId,
  ToggleOnTimingProps
>(({ stagger = STATE - LABEL }): TimelineElement<ToggleOnElementId>[] => [
  { id: "camera", lane: "Camera", label: "Settle", start: 0, length: CAMERA },
  {
    id: "press",
    lane: "Toggle",
    label: "Press",
    start: PRESS,
    length: FLIP - PRESS,
  },
  {
    id: "flip",
    lane: "Toggle",
    label: "Flip on",
    start: FLIP,
    length: OPEN_END,
    follows: "press",
    beats: { relax: RELAX, openAt: OPEN_AT, openEnd: OPEN_END },
  },
  {
    id: "light",
    lane: "Glow",
    label: "Light up",
    start: LIGHT,
    length: LIGHT_LEN,
  },
  { id: "label", lane: "Label", label: "Label", start: LABEL, length: WORD },
  {
    id: "state",
    lane: "Label",
    label: "State word",
    start: LABEL + stagger,
    length: WORD,
    follows: "label",
  },
]);
