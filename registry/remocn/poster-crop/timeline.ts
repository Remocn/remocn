import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera drifting in close on the first letter, pulling back to the
// full poster and pushing in a hair, the grid drawing in column by column
// and the labels rising in. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type PosterCropElementId = "drift" | "pull" | "grid" | "labels" | "push";

export interface PosterCropTimingProps {
  pull?: number;
}

const PULL_START = 8;
const PULL_END = 104;
const DRIFT = 30;
/** The grid lands this long before the pull ends. */
const GRID_AT = 44;
const GRID_DRAW = 48;
const GRID_STAGGER = 2;
/** Columns of the grid; its lines are drawn `GRID_STAGGER` apart. */
export const COLUMNS = 6;
const LABELS_AT = 80;
const LABEL_RISE = 24;
const LABEL_STAGGER = 4;
/** Kicker, meta and note. */
const LABELS = 3;
const PUSH = 60;

// `drift` eases the opening drift out, `pull` pulls the camera back to the
// full poster and `push` pushes in after it. `grid` draws the header rule
// and the column lines, `stagger` apart, each over `draw`; `labels` raises
// the kicker, meta and note, `stagger` apart, each over `rise`. The grid,
// the labels and the push are timed against the end of the pull and follow
// it.
export const posterCropTimeline = defineTimeline<
  PosterCropElementId,
  PosterCropTimingProps
>(({ pull = PULL_END - PULL_START }) => {
  const pullEnd = PULL_START + pull;
  const shift = pullEnd - PULL_END;
  const gridAt = GRID_AT + shift;
  const labelsAt = LABELS_AT + shift;
  const elements: TimelineElement<PosterCropElementId>[] = [
    {
      id: "drift",
      lane: "Camera",
      label: "drift",
      start: 0,
      length: PULL_START + DRIFT,
    },
    {
      id: "pull",
      lane: "Camera",
      label: "pull back",
      start: PULL_START,
      length: pull,
    },
    {
      id: "grid",
      lane: "Grid",
      label: "grid",
      start: gridAt,
      length: COLUMNS * GRID_STAGGER + GRID_DRAW,
      follows: gridAt >= PULL_START ? "pull" : undefined,
      beats: { stagger: GRID_STAGGER, draw: GRID_DRAW },
    },
    {
      id: "labels",
      lane: "Labels",
      label: "labels",
      start: labelsAt,
      length: (LABELS - 1) * LABEL_STAGGER + LABEL_RISE,
      follows: labelsAt >= PULL_START ? "pull" : undefined,
      beats: { stagger: LABEL_STAGGER, rise: LABEL_RISE },
    },
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: pullEnd,
      length: PUSH,
      follows: "pull",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
