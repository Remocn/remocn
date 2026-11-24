import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type GridMontageElementId =
  | "opener"
  | "split"
  | `swap:${number}`
  | "grow"
  | "merge";

export interface GridMontageTimingProps {
  beat?: number;
}

/** Frames between a tile's swap and the next tile's. */
const SWAP_STAGGER = 2;
/** Frames one tile's shot takes to slide over the one before. */
const SWAP = 8;
/** Frames the 3x3 grid takes to close into the last shot. */
const MERGE = 12;
/** Frames after the merge the closing shot keeps pushing in. */
const CLOSER_TAIL = 40;

/** The montage's beat length: the prop, never below 8 frames. */
export function gridMontageBeat(beat = 14) {
  return Math.max(8, beat);
}

// The opener plays full frame, splits into a 2x2 grid, each tile swaps to
// its own shot (swap:0), the grid grows to 3x3, every tile swaps to a piece
// of the closing shot (swap:1) and the grid merges into it. Each phase runs
// until the next, two beats apart.
export const gridMontageTimeline = defineTimeline<
  GridMontageElementId,
  GridMontageTimingProps
>(({ beat }): TimelineElement<GridMontageElementId>[] => {
  const b = gridMontageBeat(beat);
  const tOpen = 2 * b;
  const tSwap1 = 3 * b;
  const tGrow = 5 * b;
  const tSwap2 = 7 * b;
  const tMerge = 9 * b;
  const swaps = { stagger: SWAP_STAGGER, swap: SWAP };
  return [
    { id: "opener", lane: "Grid", label: "Opener", start: 0, length: tOpen },
    {
      id: "split",
      lane: "Grid",
      label: "Split into 2x2",
      start: tOpen,
      length: tSwap1 - tOpen,
      follows: "opener",
    },
    {
      id: "swap:0",
      lane: "Grid",
      label: "Tiles swap to their shots",
      start: tSwap1,
      length: tGrow - tSwap1,
      follows: "split",
      beats: swaps,
    },
    {
      id: "grow",
      lane: "Grid",
      label: "Grow to 3x3",
      start: tGrow,
      length: tSwap2 - tGrow,
      follows: "swap:0",
    },
    {
      id: "swap:1",
      lane: "Grid",
      label: "Tiles swap to the closer",
      start: tSwap2,
      length: tMerge - tSwap2,
      follows: "grow",
      beats: swaps,
    },
    {
      id: "merge",
      lane: "Grid",
      label: "Merge into the closer",
      start: tMerge,
      length: MERGE,
      follows: "swap:1",
      beats: { tail: CLOSER_TAIL },
    },
  ];
});
