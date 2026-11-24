import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The total landing in the middle under a slow push, the bar drawing under
// it, then after `hold` the total moving up as its label slides in and the
// bar splits, the tree's stem and span drawing, its branches dropping to
// the parts, and each part's value counting in under its branch. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type NumberSplitElementId =
  | "total"
  | "camera"
  | "drift"
  | "bar"
  | "move"
  | "label"
  | "split"
  | "stem"
  | "span"
  | "branches"
  | "parts";

export interface NumberSplitTimingProps {
  hold?: number;
}

const BAR_IN = 10;
export const MOVE = 36;
export const MOVE_DUR = 26;

// `total` lands over its length and sharpens over `blur`. `split` breaks the
// bar into segments over `fade` and opens the gaps over its length. Branch
// `i` drops `spread * f` frames into `branches`, where `f` is how far its
// segment sits from the root (0 to 1), over `drop`; part `i`'s value comes
// in `wait` frames after its branch: it lands over `in`, counts over
// `count` and its label shows from `labelAt` to `labelEnd`. Everything
// after the move follows it.
export const numberSplitTimeline = defineTimeline<
  NumberSplitElementId,
  NumberSplitTimingProps
>(({ hold = MOVE }): TimelineElement<NumberSplitElementId>[] => {
  const moveAt = hold;
  const splitAt = moveAt + MOVE_DUR - 10;
  const treeAt = moveAt + MOVE_DUR - 2;
  const elements: TimelineElement<NumberSplitElementId>[] = [
    {
      id: "total",
      lane: "Total",
      label: "total lands",
      start: 0,
      length: 18,
      beats: { blur: 9 },
    },
    {
      id: "camera",
      lane: "Camera",
      label: "push",
      start: 0,
      length: treeAt + 90,
    },
    {
      id: "drift",
      lane: "Bar",
      label: "gradient drift",
      start: 0,
      length: 150,
    },
    { id: "bar", lane: "Bar", label: "bar draws", start: BAR_IN, length: 20 },
    {
      id: "move",
      lane: "Total",
      label: "move up",
      start: moveAt,
      length: MOVE_DUR,
    },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: moveAt + 14,
      length: 18,
      follows: "move",
    },
    {
      id: "split",
      lane: "Bar",
      label: "split",
      start: splitAt,
      length: 16,
      follows: "move",
      beats: { fade: 12 },
    },
    {
      id: "stem",
      lane: "Tree",
      label: "stem",
      start: treeAt,
      length: 8,
      follows: "move",
    },
    {
      id: "span",
      lane: "Tree",
      label: "span",
      start: treeAt + 8,
      length: 14,
      follows: "stem",
    },
    {
      id: "branches",
      lane: "Branches",
      label: "branches drop",
      start: treeAt + 8,
      length: 12 + 10,
      follows: "stem",
      beats: { spread: 12, drop: 10 },
    },
    {
      id: "parts",
      lane: "Parts",
      label: "parts count in",
      start: treeAt + 8,
      length: 12 + 6 + 24,
      follows: "stem",
      beats: {
        spread: 12,
        wait: 6,
        in: 16,
        count: 24,
        labelAt: 4,
        labelEnd: 18,
      },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
