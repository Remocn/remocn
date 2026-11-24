import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line cascade: the floor drawing in, the hairlines raining down to pile
// up into the number, the pile snapping solid, then the caption. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type LineCascadeElementId = "floor" | "rain" | "snap" | "caption";

/** The scene's timing does not depend on its props. */
export type LineCascadeTimingProps = object;

// `rain` runs until the snap: a line lands `lead` after it starts plus its
// height in the glyph times `span` (and a little per-column scatter). `snap`
// turns the pile solid: the lines widen over its length, fill in from
// `solidAt` over `solid`, the loose pile fades from `pileAt` over `pile` and
// the floor fades over `fade`; every line has landed by `landBy`.
export const lineCascadeTimeline = defineTimeline<
  LineCascadeElementId,
  LineCascadeTimingProps
>((): TimelineElement<LineCascadeElementId>[] => [
  { id: "floor", lane: "Floor", label: "floor", start: 2, length: 18 },
  {
    id: "rain",
    lane: "Lines",
    label: "rain",
    start: 10,
    length: 92,
    follows: "floor",
    beats: { lead: 12, span: 78 },
  },
  {
    id: "snap",
    lane: "Lines",
    label: "snap solid",
    start: 102,
    length: 9,
    follows: "rain",
    beats: {
      fade: 15,
      solidAt: 2,
      solid: 6,
      pileAt: 6,
      pile: 4,
      landBy: -5,
    },
  },
  {
    id: "caption",
    lane: "Caption",
    label: "caption",
    start: 108,
    length: 16,
    follows: "snap",
  },
]);
