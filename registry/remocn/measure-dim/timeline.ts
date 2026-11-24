import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The slow push in, the hero bar wiping in with its label, its extension
// lines and dimension arrow counting the value up, then the dashed "before"
// bar with its own extension lines and arrow. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type MeasureDimElementId =
  | "push"
  | "bar"
  | "extend"
  | "measure"
  | "ghost"
  | "ghost-extend"
  | "ghost-measure";

export interface MeasureDimTimingProps {
  before?: string;
}

const BAR_AT = 2;
const EXT_A = 16;
const ARR_A = 24;
const ARR_LEN = 26;
const GHOST_AT = ARR_A + ARR_LEN - 4;
const EXT_B = GHOST_AT + 10;
const ARR_B = GHOST_AT + 16;

// `push` scales the whole scene up a touch over its length. `bar` wipes the
// hero bar in; its label slides in from `labelAt` to `labelEnd`. `extend`
// draws the hero's extension lines and `measure` grows its arrows and counts
// the value up. The "before" bar has the same three, `ghost`, `ghost-extend`
// and `ghost-measure`, when there is one. Each follows the one before.
export const measureDimTimeline = defineTimeline<
  MeasureDimElementId,
  MeasureDimTimingProps
>(({ before = "60 fps" }) => {
  const elements: TimelineElement<MeasureDimElementId>[] = [
    {
      id: "push",
      lane: "Camera",
      label: "Push in",
      start: 0,
      length: ARR_B + 60,
    },
    {
      id: "bar",
      lane: "Hero",
      label: "Bar",
      start: BAR_AT,
      length: 18,
      beats: { labelAt: 14, labelEnd: 28 },
    },
    {
      id: "extend",
      lane: "Hero",
      label: "Extension lines",
      start: EXT_A,
      length: 12,
      follows: "bar",
    },
    {
      id: "measure",
      lane: "Hero",
      label: "Dimension",
      start: ARR_A,
      length: ARR_LEN,
      follows: "extend",
    },
  ];
  if (before) {
    elements.push(
      {
        id: "ghost",
        lane: "Before",
        label: "Before bar",
        start: GHOST_AT,
        length: 16,
        follows: "measure",
        beats: { labelAt: 10, labelEnd: 24 },
      },
      {
        id: "ghost-extend",
        lane: "Before",
        label: "Extension lines",
        start: EXT_B,
        length: 12,
        follows: "ghost",
      },
      {
        id: "ghost-measure",
        lane: "Before",
        label: "Dimension",
        start: ARR_B,
        length: 22,
        follows: "ghost-extend",
      },
    );
  }
  return elements;
});
