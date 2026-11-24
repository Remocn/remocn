import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line field fading in and reaching out from its middle row, the word
// rising out of the lines in a sweep from left to right, the lines settling
// flat and the word revealing itself. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type LineReliefElementId =
  | "enter"
  | "spread"
  | "rise"
  | "settle"
  | "reveal";

export interface LineReliefTimingProps {
  sweep?: number;
}

const SWEEP_DELAY = 16;
const GROW = 34;

// `enter` fades the field in. `spread` draws each line out from the left,
// the middle rows first: a row starts `step` frames per row away from the
// middle and reaches across in `reach`. `rise` lifts the word out of the
// lines: a point at the left edge grows over `grow`, one at the right edge
// `sweep` frames later. `settle` flattens the lines and `reveal` brings the
// drawn word in over them.
export const lineReliefTimeline = defineTimeline<
  LineReliefElementId,
  LineReliefTimingProps
>(({ sweep = SWEEP_DELAY }) => {
  const elements: TimelineElement<LineReliefElementId>[] = [
    { id: "enter", lane: "Field", label: "Enter", start: 0, length: 12 },
    {
      id: "spread",
      lane: "Lines",
      label: "Spread",
      start: 0,
      length: 20,
      beats: { step: 0.12, reach: 20 },
    },
    {
      id: "rise",
      lane: "Relief",
      label: "Rise",
      start: 6,
      length: GROW + sweep,
      beats: { grow: GROW, sweep },
    },
    {
      id: "settle",
      lane: "Relief",
      label: "Settle",
      start: 84,
      length: 24,
      follows: "rise",
    },
    {
      id: "reveal",
      lane: "Word",
      label: "Reveal",
      start: 88,
      length: 24,
      follows: "settle",
    },
  ];
  return elements;
});
