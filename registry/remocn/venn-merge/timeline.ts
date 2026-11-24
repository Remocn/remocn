import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The circles draw on with their set labels, slide together, the overlap
// fills, then the brand and the caption land in it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type VennMergeElementId =
  | "draw"
  | "push"
  | `label:${number}`
  | "slide"
  | "fill"
  | "brand"
  | "caption";

export interface VennMergeTimingProps {
  sets?: string[];
  center?: string;
  caption?: string;
  slide?: number;
}

export const DEFAULT_SETS = ["Design", "Code"];
export const DEFAULT_CENTER = "remocn";
export const DEFAULT_CAPTION = "Motion design, written as code.";
const DRAW = [0, 24];
const SLIDE = [26, 66];
const FILL = [62, 84];
const BRAND = 74;
const CAPTION = 96;

/** The sets on the diagram: up to three, the defaults when empty. */
export function vennSets(sets: string[]) {
  return (sets.length ? sets : DEFAULT_SETS).slice(0, 3);
}

// `draw` draws the circles on; `label:<i>` fades set `i`'s label in, a
// chain. `slide` brings the circles together over its length. `fill` fills
// the overlap, and its glow drifts across over `glow`. `brand` and
// `caption` land in turn. `push` is the slow push over the shot.
export const vennMergeTimeline = defineTimeline<
  VennMergeElementId,
  VennMergeTimingProps
>(
  ({
    sets = DEFAULT_SETS,
    center = DEFAULT_CENTER,
    caption = DEFAULT_CAPTION,
    slide = SLIDE[1] - SLIDE[0],
  }) => {
    const elements: TimelineElement<VennMergeElementId>[] = [
      {
        id: "draw",
        lane: "Circles",
        label: "Draw",
        start: DRAW[0],
        length: DRAW[1] - DRAW[0],
      },
      {
        id: "push",
        lane: "Camera",
        label: "Push",
        start: 0,
        length: CAPTION + 40,
      },
      ...vennSets(sets).map(
        (name, i): TimelineElement<VennMergeElementId> => ({
          id: `label:${i}`,
          lane: "Labels",
          label: name,
          start: DRAW[0] + 4 + i * 3,
          length: 16,
          follows: i > 0 ? `label:${i - 1}` : undefined,
        }),
      ),
      {
        id: "slide",
        lane: "Circles",
        label: "Slide",
        start: SLIDE[0],
        length: slide,
        follows: "draw",
      },
      {
        id: "fill",
        lane: "Overlap",
        label: "Fill",
        start: FILL[0],
        length: FILL[1] - FILL[0],
        follows: "slide",
        beats: { glow: CAPTION + 60 - FILL[0] },
      },
      {
        id: "brand",
        lane: "Brand",
        label: center,
        start: BRAND,
        length: 22,
        follows: "fill",
      },
      {
        id: "caption",
        lane: "Caption",
        label: caption,
        start: CAPTION,
        length: 20,
        follows: "brand",
      },
    ];
    return elements;
  },
);
