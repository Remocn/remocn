import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid's column bands and rules drawing in, the four blocks (number,
// headline, body, logo) snapping column by column onto the grid, the grid
// fading out and the slow push after it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type GridSnapPosterElementId =
  | `band:${number}`
  | "rules"
  | "number"
  | "headline"
  | "body"
  | "logo"
  | "grid-out"
  | "push";

export interface GridSnapPosterTimingProps {
  step?: number;
}

export const COLS = 12;
export const STEP = 5;
const MOVE = 3;
const GRID_FADE = 84;

/** Where a block starts and lands, in grid columns. */
export const SNAPS = [
  { id: "number", label: "Number", from: 4, to: 0, start: 20 },
  { id: "headline", label: "Headline", from: 3, to: 0, start: 32 },
  { id: "body", label: "Body", from: 6, to: 9, start: 54 },
  { id: "logo", label: "Logo", from: 10, to: 9, start: 66 },
] as const;

// `band:<i>` draws column `i` down, a chain two frames apart. A block's
// element runs from its first column step to landing: it fades in from
// `appearAt` to `appearEnd` (negative, before the start), then moves one
// column every `step` frames, each move taking `move`. The blocks are a
// chain, as are the bands.
export const gridSnapPosterTimeline = defineTimeline<
  GridSnapPosterElementId,
  GridSnapPosterTimingProps
>(({ step = STEP }) => {
  const elements: TimelineElement<GridSnapPosterElementId>[] = [
    ...Array.from(
      { length: COLS },
      (_, i): TimelineElement<GridSnapPosterElementId> => ({
        id: `band:${i}`,
        lane: "Grid",
        label: `Column ${i + 1}`,
        start: i * 2,
        length: 18,
        follows: i > 0 ? `band:${i - 1}` : undefined,
      }),
    ),
    { id: "rules", lane: "Rules", label: "Rules", start: 4, length: 30 },
    ...SNAPS.map(
      (s, k): TimelineElement<GridSnapPosterElementId> => ({
        id: s.id,
        lane: "Blocks",
        label: s.label,
        start: s.start,
        length: Math.abs(s.to - s.from) * step,
        follows: k > 0 ? SNAPS[k - 1].id : undefined,
        beats: { appearAt: -8, appearEnd: -2, step, move: MOVE },
      }),
    ),
    {
      id: "grid-out",
      lane: "Grid",
      label: "Grid out",
      start: GRID_FADE,
      length: 22,
    },
    { id: "push", lane: "Camera", label: "Push", start: GRID_FADE, length: 70 },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
