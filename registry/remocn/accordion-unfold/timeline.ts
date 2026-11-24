import { defineTimeline } from "@/lib/remocn/timeline";

// The folded card fades in and lifts, then its pleats spring open flat.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type AccordionUnfoldElementId = "card" | "unfold";

const START = 4;

// `card` fades the folded card in over `fade` and lifts it to full size over
// its length. `unfold` springs the pleats open from its start; its length is
// roughly where the spring settles.
export const accordionUnfoldTimeline = defineTimeline<
  AccordionUnfoldElementId,
  object
>(() => [
  {
    id: "card",
    lane: "Card",
    label: "Lift",
    start: 0,
    length: START + 2,
    beats: { fade: 3 },
  },
  { id: "unfold", lane: "Pleats", label: "Unfold", start: START, length: 40 },
]);
