import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The removed line rising in, its minus mark, the diff opening with the plus
// band, the added line rising in, and the swap: the removed row folding away
// while the added one grows, the bands clear and the highlight lights up.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type DiffSwapElementId = "before" | "mark" | "open" | "added" | "swap";

export interface DiffSwapTimingProps {
  before?: string;
  after?: string;
  foldAt?: number;
}

export const DEFAULT_BEFORE = "Keyframe every frame by hand.";
export const DEFAULT_AFTER = "Install the scene. Edit the props.";
const FOLD_AT = 72;

const LINE_STAGGER = 3;
const LINE_RISE = 18;
const MARK_AT = 30;
const MARK = 14;
const OPEN_AT = 42;
const OPEN = 18;
const BAND_AT = 4;
const BAND = 14;
const ADDED_AT = 53;
const FOLD = 20;
const GROW_AT = 4;
const GROW = 22;
const CLEAR_AT = 6;
const CLEAR = 16;
const LIGHT_AT = 12;
const LIGHT = 18;

// A line wraps to two at most; with one word it stays one.
const linesOf = (text: string) =>
  Math.min(2, Math.max(1, text.split(/\s+/).filter(Boolean).length));

// `before` and `added` rise line by line, `stagger` apart, each over `rise`.
// `open` opens the diff and draws the plus band over its `band` beat from
// `bandAt`. `swap` folds the removed row away over `fold`, grows the added
// row from `growAt` over `grow`, clears the bands from `clearAt` over
// `clear` and lights the highlight from `lightAt` over `light`. The intro
// forms a chain; the swap starts at `foldAt`.
export const diffSwapTimeline = defineTimeline<
  DiffSwapElementId,
  DiffSwapTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    after = DEFAULT_AFTER,
    foldAt = FOLD_AT,
  }): TimelineElement<DiffSwapElementId>[] => {
    const elements: TimelineElement<DiffSwapElementId>[] = [
      {
        id: "before",
        lane: "Removed",
        label: before,
        start: 0,
        length: (linesOf(before) - 1) * LINE_STAGGER + LINE_RISE,
        beats: { stagger: LINE_STAGGER, rise: LINE_RISE },
      },
      {
        id: "mark",
        lane: "Removed",
        label: "minus mark",
        start: MARK_AT,
        length: MARK,
        follows: "before",
      },
      {
        id: "open",
        lane: "Added",
        label: "diff opens",
        start: OPEN_AT,
        length: OPEN,
        follows: "mark",
        beats: { bandAt: BAND_AT, band: BAND },
      },
      {
        id: "added",
        lane: "Added",
        label: after,
        start: ADDED_AT,
        length: (linesOf(after) - 1) * LINE_STAGGER + LINE_RISE,
        follows: "open",
        beats: { stagger: LINE_STAGGER, rise: LINE_RISE },
      },
      {
        id: "swap",
        lane: "Swap",
        label: "swap",
        start: foldAt,
        length: LIGHT_AT + LIGHT,
        beats: {
          fold: FOLD,
          growAt: GROW_AT,
          grow: GROW,
          clearAt: CLEAR_AT,
          clear: CLEAR,
          lightAt: LIGHT_AT,
          light: LIGHT,
        },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
