import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each diagonal of the grid rising, front row first. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type IsometricBuildElementId = `row:${number}`;

export interface IsometricBuildTimingProps {
  grid?: number;
  stagger?: number;
}

const GRID = 5;
const STAGGER = 2;
/** The springs settle in about this long. */
const RISE = 24;

/** Tiles per side, as the component rounds `grid`. */
export function tilesOf(grid: number) {
  return Math.max(1, Math.round(grid));
}

// `row:<k>` is the `k`-th diagonal to rise, counted from the front; the
// rows are a chain. Each block in a row rises at a seeded share of the
// row's `stagger` beat after the row starts.
export const isometricBuildTimeline = defineTimeline<
  IsometricBuildElementId,
  IsometricBuildTimingProps
>(({ grid = GRID, stagger = STAGGER }) => {
  const n = tilesOf(grid);
  const rows = 2 * (n - 1) + 1;
  const elements: TimelineElement<IsometricBuildElementId>[] = [];
  for (let k = 0; k < rows; k++) {
    elements.push({
      id: `row:${k}`,
      lane: "Rows",
      label: `Row ${k + 1}`,
      start: k * stagger,
      length: k < rows - 1 ? stagger : stagger + RISE,
      follows: k > 0 ? `row:${k - 1}` : undefined,
      beats: { stagger },
    });
  }
  return elements;
});
