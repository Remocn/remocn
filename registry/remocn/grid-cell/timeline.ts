import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid drawing out from the centre, the cell's edges brightening and its
// fill merging in, the corner ticks and label, the headline typed into the
// cell and the grid dimming behind it. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type GridCellElementId =
  | "grid"
  | "edge"
  | "merge"
  | "label"
  | "title"
  | "dim";

export interface GridCellTimingProps {
  title?: string;
  stagger?: number;
  cellSize?: number;
}

export const DEFAULT_TITLE = "Introducing remocn 2.0";
/** Base cell at 1280 wide: 16 × 9 cells tile the frame exactly. */
export const CELL = 80;
export const PER_CHAR = 1.5;

const GRID_START = 2;
const GRID_STEP = 2.4; // frames per cell of distance from the centre
const GRID_DUR = 26;
const EDGE_START = 38;
const EDGE_DUR = 22;
const MERGE_START = 44;
const MERGE_DUR = 22;
const LABEL_START = 58;
const LABEL_DUR = 16;
const TYPE_START = 70;
const DIM_START = 96;
const DIM_DUR = 34;

// `grid` is every grid line growing, `step` frames later per cell from the
// centre, each over `grow`; its length reaches the farthest line of a 16:9
// frame. `label` carries the corner ticks (from `ticksIn` to `ticksDone`).
// `title` is the headline typed `perChar` frames a character, with the caret
// fading in (`caretIn` to `caretFull`) and showing from `caretOn` before it.
// Each element follows the one before.
export const gridCellTimeline = defineTimeline<
  GridCellElementId,
  GridCellTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    stagger = PER_CHAR,
    cellSize = CELL,
  }): TimelineElement<GridCellElementId>[] => {
    const reach = Math.max(
      Math.ceil(640 / cellSize),
      Math.ceil(360 / cellSize) * 1.6,
    );
    return [
      {
        id: "grid",
        lane: "Grid",
        label: "grid",
        start: GRID_START,
        length: reach * GRID_STEP + GRID_DUR,
        beats: { step: GRID_STEP, grow: GRID_DUR },
      },
      {
        id: "edge",
        lane: "Cell",
        label: "edges",
        start: EDGE_START,
        length: EDGE_DUR,
        follows: "grid",
      },
      {
        id: "merge",
        lane: "Cell",
        label: "fill",
        start: MERGE_START,
        length: MERGE_DUR,
        follows: "edge",
      },
      {
        id: "label",
        lane: "Label",
        label: "label",
        start: LABEL_START,
        length: LABEL_DUR,
        follows: "merge",
        beats: { ticksIn: -4, ticksDone: 12 },
      },
      {
        id: "title",
        lane: "Title",
        label: title,
        start: TYPE_START,
        length: [...title].length * stagger,
        follows: "label",
        beats: { perChar: stagger, caretIn: -8, caretOn: -6, caretFull: -2 },
      },
      {
        id: "dim",
        lane: "Grid",
        label: "dim",
        start: DIM_START,
        length: DIM_DUR,
        follows: "title",
      },
    ];
  },
);
