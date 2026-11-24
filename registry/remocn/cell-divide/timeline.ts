import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera push, the first cell and the count fading in, each division of
// every cell into two (the count rolling to the doubled number on the way),
// and the last generation's ripple. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type CellDivideElementId =
  | "push"
  | "intro"
  | "count"
  | "label"
  | `division:${number}`
  | "ripple";

export interface CellDivideTimingProps {
  generations?: number;
  pause?: number;
}

const START = 14;
const MOTION = [17, 15, 14, 13, 12, 12, 12];
export const PAUSE = 4;
const SWITCH_AT = 0.74;
const ROLL = 9;

export function gridOf(g: number) {
  return { cols: 2 ** Math.ceil(g / 2), rows: 2 ** Math.floor(g / 2) };
}

/** The number of divisions, two to seven. */
export function generationsOf(generations: number) {
  return Math.max(2, Math.min(7, Math.round(generations)));
}

function schedule(G: number, pause: number) {
  let t = START;
  const divs: { start: number; dur: number }[] = [];
  for (let g = 0; g < G; g++) {
    const dur = MOTION[Math.min(g, MOTION.length - 1)];
    divs.push({ start: t, dur });
    t += dur + pause;
  }
  return { divs, end: t - pause };
}

// `division:<g>` splits every cell of generation `g` in two over its length,
// `pause` apart; a chain. The count rolls to the new number `switch` frames
// in, over `roll`. `ripple` swells the last generation's cells, `step`
// frames apart along the grid's diagonals, each over `swell`; it follows
// the last division. `push` runs from the first frame to 30 frames past the
// last division.
export const cellDivideTimeline = defineTimeline<
  CellDivideElementId,
  CellDivideTimingProps
>(({ generations = 6, pause = PAUSE }) => {
  const G = generationsOf(generations);
  const { divs, end } = schedule(G, pause);
  const { cols, rows } = gridOf(G);
  const elements: TimelineElement<CellDivideElementId>[] = [
    { id: "push", lane: "Camera", label: "Push", start: 0, length: end + 30 },
    { id: "intro", lane: "Cells", label: "Intro", start: 0, length: 16 },
    { id: "count", lane: "Count", label: "Count", start: 6, length: 18 },
    { id: "label", lane: "Label", label: "Label", start: 12, length: 18 },
    ...divs.map(
      (d, g): TimelineElement<CellDivideElementId> => ({
        id: `division:${g}`,
        lane: "Cells",
        label: `×${2 ** (g + 1)}`,
        start: d.start,
        length: d.dur,
        follows: g > 0 ? `division:${g - 1}` : undefined,
        beats: { switch: d.dur * SWITCH_AT, roll: ROLL },
      }),
    ),
    {
      id: "ripple",
      lane: "Cells",
      label: "Ripple",
      start: end + 2,
      length: 9 + (cols + rows - 2) * 0.6,
      follows: `division:${G - 1}`,
      beats: { step: 0.6, swell: 9 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
