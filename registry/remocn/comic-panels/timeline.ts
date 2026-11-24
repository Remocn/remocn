import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The page border drawing in, the two gutters cracking the page into
// panels, the side panels sliding in, then the shake and the starburst
// blowing up over everything. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ComicPanelsElementId =
  | "border"
  | `gutter:${number}`
  | `panel:${number}`
  | "shake"
  | "burst";

/** The scene's timing does not depend on its props. */
export type ComicPanelsTimingProps = object;

// `gutter:0` is the slanted horizontal gutter, which also lifts the hero
// into the top panel; `gutter:1` the vertical one. `panel:0` slides in from
// the left, `panel:1` from the right. `burst` grows the starburst to fill
// the frame; its white star settles from `settleAt` over `settle`.
export const comicPanelsTimeline = defineTimeline<
  ComicPanelsElementId,
  ComicPanelsTimingProps
>((): TimelineElement<ComicPanelsElementId>[] => [
  { id: "border", lane: "Page", label: "border", start: 0, length: 8 },
  {
    id: "gutter:0",
    lane: "Gutters",
    label: "horizontal gutter",
    start: 2,
    length: 8,
  },
  {
    id: "gutter:1",
    lane: "Gutters",
    label: "vertical gutter",
    start: 8,
    length: 6,
    follows: "gutter:0",
  },
  {
    id: "panel:0",
    lane: "Panels",
    label: "left panel",
    start: 10,
    length: 8,
    follows: "gutter:0",
  },
  {
    id: "panel:1",
    lane: "Panels",
    label: "right panel",
    start: 13,
    length: 8,
    follows: "panel:0",
  },
  {
    id: "shake",
    lane: "Shake",
    label: "shake",
    start: 22,
    length: 9,
    follows: "panel:1",
  },
  {
    id: "burst",
    lane: "Burst",
    label: "starburst",
    start: 23,
    length: 11,
    follows: "panel:1",
    beats: { settleAt: 7, settle: 6 },
  },
]);
