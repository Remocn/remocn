import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The mark appears as one cell inside corner guides, then splits level by
// level into a quadtree of its shape; the cells resolve into the lit mark,
// the camera pans to make room as the name slides in letter by letter, and
// the cells merge into the finished mark. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type QuadtreeMarkElementId =
  | "guides"
  | "appear"
  | `split:${number}`
  | "glow"
  | "pan"
  | `letter:${number}`
  | "merge";

export interface QuadtreeMarkTimingProps {
  name?: string;
  stagger?: number;
  depth?: number;
}

export const DEFAULT_NAME = "emocn";
export const DEFAULT_STAGGER = 2.5;
/** Most levels of subdivision. */
export const MAX_DEPTH = 6;
const APPEAR = 10;
const SPLIT_STEPS = [14, 9, 7, 6, 5, 5];
const PAN_AT = 64;
const PAN_DUR = 30;
const WORD_AT = 74;
const LETTER_IN = 14;
const MERGE_AT = 82;
const MERGE_DUR = 16;

/** Levels the quadtree is split into for a `depth` prop. */
export function levelsOf(depth: number) {
  return Math.max(1, Math.min(MAX_DEPTH, Math.round(depth)));
}

// The guides fade in over `in` and out from `out` to `outEnd`. The camera
// settles over `appear`. Each split level runs until the next: its cells
// split on their own small offsets from its start. The letters are a chain.
export const quadtreeMarkTimeline = defineTimeline<
  QuadtreeMarkElementId,
  QuadtreeMarkTimingProps
>(({ name = DEFAULT_NAME, stagger = DEFAULT_STAGGER, depth = MAX_DEPTH }) => {
  const elements: TimelineElement<QuadtreeMarkElementId>[] = [
    {
      id: "guides",
      lane: "Guides",
      label: "Corner guides",
      start: 0,
      length: 62,
      beats: { in: 8, out: 44 },
    },
    {
      id: "appear",
      lane: "Camera",
      label: "Mark appears",
      start: 0,
      length: APPEAR + 4,
    },
  ];
  let at = APPEAR;
  for (let d = 0; d < levelsOf(depth); d++) {
    elements.push({
      id: `split:${d}`,
      lane: "Splits",
      label: `Level ${d + 1}`,
      start: at,
      length: SPLIT_STEPS[d],
      follows: d > 0 ? `split:${d - 1}` : undefined,
    });
    at += SPLIT_STEPS[d];
  }
  elements.push(
    {
      id: "glow",
      lane: "Glow",
      label: "Glow",
      start: 24,
      length: 56,
    },
    {
      id: "pan",
      lane: "Camera",
      label: "Pan to the lockup",
      start: PAN_AT,
      length: PAN_DUR,
    },
  );
  name.split("").forEach((ch, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Name",
      label: ch,
      start: WORD_AT + i * stagger,
      length: LETTER_IN,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "merge",
    lane: "Splits",
    label: "Cells merge",
    start: MERGE_AT,
    length: MERGE_DUR,
  });
  return elements.sort((a, b) => a.start - b.start);
});
