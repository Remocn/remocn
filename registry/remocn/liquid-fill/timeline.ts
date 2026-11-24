import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A drop falls into the mark, the liquid fills it and settles, then the mark
// slides aside for the wordmark. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type LiquidFillElementId = "drop" | "fill" | "slide";

const LAND = 9;
const FULL = 34;
const SLIDE = 36;

// `drop` falls over its length: it fades in over `fadeIn` and is gone at
// `gone`, while the outline fades in over `outline`. `fill` raises the
// liquid to the brim over its length; the splash wobbles out over `wobble`,
// bubbles start from `bubblesAt`, spread over `spread`, and the outline
// turns solid from `solidAt` to `solidEnd`. `slide` moves the mark aside
// over its length and wipes the wordmark in from `revealAt` to `revealEnd`.
export const liquidFillTimeline = defineTimeline<LiquidFillElementId, object>(
  (): TimelineElement<LiquidFillElementId>[] => [
    {
      id: "drop",
      lane: "Mark",
      label: "Drop",
      start: 0,
      length: LAND,
      beats: { fadeIn: 2, gone: LAND + 1, outline: 5 },
    },
    {
      id: "fill",
      lane: "Mark",
      label: "Fill",
      start: LAND,
      length: FULL - LAND,
      follows: "drop",
      beats: {
        wobble: FULL - LAND + 6,
        bubblesAt: 2,
        spread: 16,
        solidAt: FULL - 2 - LAND,
        solidEnd: FULL + 3 - LAND,
      },
    },
    {
      id: "slide",
      lane: "Wordmark",
      label: "Reveal",
      start: SLIDE,
      length: 11,
      follows: "fill",
      beats: { revealAt: 2, revealEnd: 13 },
    },
  ],
);
