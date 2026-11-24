import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The blueprint drawing itself (grid, screen outline, dimension lines, the
// long structure lines, the cards, the content), the caption, the camera
// push and the diagonal fill sweeping the finished screen in. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type WireframeToFinalElementId =
  | "grid"
  | "outline"
  | "dims"
  | "structure"
  | "caption"
  | "boxes"
  | "content"
  | "push"
  | "sweep";

export interface WireframeToFinalTimingProps {
  sweep?: number;
}

const FRAME_DRAW = [2, 28];
const DIM_DRAW = [12, 36];
const STRUCT_DRAW = 22;
const BOX_DRAW = [30, 62];
const CONTENT_DRAW = [42, 90];
const SWEEP = [104, 152];
const SWEEP_LENGTH = SWEEP[1] - SWEEP[0];
const PUSH = [96, 230];

// `grid` fades the grid and the crop marks in. `outline` draws the screen's
// edge. `dims` draws the dimension lines; their labels fade in from
// `labelAt` to `labelEnd`, and the 13 ticks draw from `tickAt`, `tick` apart,
// each over `tickDraw`. `structure` draws the long lines. `boxes` draws each
// card over `box`, spread across the element by its place along the
// diagonal; `content` does the same with each item over `item` (a chart line
// over `path`). `caption` fades the first caption in. `push` is the slow
// camera push. `sweep` fills the screen in over its length: the front line
// fades in and out over `fade`, the guides hand over to the screenshot from
// `lead` before its end to `tail` after it, and the caption swaps from
// `capAt` over `cap`.
export const wireframeToFinalTimeline = defineTimeline<
  WireframeToFinalElementId,
  WireframeToFinalTimingProps
>(({ sweep = SWEEP_LENGTH }) => {
  const elements: TimelineElement<WireframeToFinalElementId>[] = [
    { id: "grid", lane: "Blueprint", label: "Grid", start: 0, length: 14 },
    {
      id: "outline",
      lane: "Blueprint",
      label: "Screen outline",
      start: FRAME_DRAW[0],
      length: FRAME_DRAW[1] - FRAME_DRAW[0],
    },
    {
      id: "dims",
      lane: "Dimensions",
      label: "Dimensions",
      start: DIM_DRAW[0],
      length: DIM_DRAW[1] - DIM_DRAW[0],
      beats: {
        labelAt: 12,
        labelEnd: DIM_DRAW[1] + 4 - DIM_DRAW[0],
        tickAt: 4,
        tick: 1.2,
        tickDraw: 8,
      },
    },
    {
      id: "structure",
      lane: "Blueprint",
      label: "Structure",
      start: STRUCT_DRAW,
      length: 18,
    },
    { id: "caption", lane: "Caption", label: "Caption", start: 26, length: 14 },
    {
      id: "boxes",
      lane: "Blueprint",
      label: "Cards",
      start: BOX_DRAW[0],
      length: BOX_DRAW[1] - BOX_DRAW[0],
      beats: { box: 16 },
    },
    {
      id: "content",
      lane: "Blueprint",
      label: "Content",
      start: CONTENT_DRAW[0],
      length: CONTENT_DRAW[1] - CONTENT_DRAW[0],
      beats: { item: 10, path: 22 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: PUSH[0],
      length: PUSH[1] - PUSH[0],
    },
    {
      id: "sweep",
      lane: "Fill",
      label: "Fill sweep",
      start: SWEEP[0],
      length: sweep,
      beats: { fade: 6, lead: 14, tail: 16, capAt: 18, cap: 16 },
    },
  ];
  return elements;
});
