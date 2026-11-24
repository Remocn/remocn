import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The baseplate fades up, then the image is built row by row from the
// bottom: each brick drops in, hops once and snaps on. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type BrickMosaicElementId = "plate" | `row:${number}`;

export interface BrickMosaicTimingProps {
  pattern?: string[] | string[][];
  cols?: number;
  rows?: number;
  rowDelay?: number;
}

export const FALL = 7;
export const HOP = 5;
/** Bricks along a row start this far apart, plus up to `JITTER` at random. */
export const COL_STEP = 0.12;
export const JITTER = 1.5;

// Row k is the k-th row from the bottom, the order they are laid in; each
// follows the one before. A row runs until the next one, the last until its
// rightmost brick has landed. A brick fades in over `fade`, falls over
// `fall` and hops over `hop`; along the row it starts later by its column
// and a random jitter, which the component adds.
export const brickMosaicTimeline = defineTimeline<
  BrickMosaicElementId,
  BrickMosaicTimingProps
>(({ pattern, cols = 24, rows = 14, rowDelay = 3 }) => {
  const nRows = pattern ? pattern.length : rows;
  const nCols = pattern
    ? Math.max(1, ...pattern.map((row) => row.length))
    : Math.max(1, cols);
  const elements: TimelineElement<BrickMosaicElementId>[] = [
    { id: "plate", lane: "Plate", label: "baseplate", start: 0, length: 10 },
  ];
  for (let k = 0; k < nRows; k++) {
    elements.push({
      id: `row:${k}`,
      lane: "Rows",
      label: `row ${k + 1} from the bottom`,
      start: k * rowDelay,
      length: k < nRows - 1 ? rowDelay : nCols * COL_STEP + JITTER + FALL + HOP,
      follows: k > 0 ? `row:${k - 1}` : undefined,
      beats: { fade: 2, fall: FALL, hop: HOP },
    });
  }
  return elements;
});
