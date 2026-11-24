import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A sliver of the mark widening, the body puffing up and wobbling out, the
// dot popping in and the wordmark sliding out beside it. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type InflateElementId = "sliver" | "puff" | "wobble" | "dot" | "slide";

const PUFF = 3;
const WOBBLE = 10;
const DOT = 15;
const SLIDE = 22;

// `sliver` widens the flat mark and fades it in over `appear`. `puff` springs
// the body up, rounding it in to `round` and squaring it off by `roundEnd`,
// with the gloss coming in from `glossAt` to `glossEnd`. `wobble` rings the
// body out: it decays over `decay` frames and swings once every `period`.
// `dot` pops the dot in. `slide` moves the mark aside over `move` and reveals
// the wordmark from `revealAt` to its end. Each follows the one before.
export const inflateTimeline = defineTimeline<InflateElementId, object>(() => {
  const elements: TimelineElement<InflateElementId>[] = [
    {
      id: "sliver",
      lane: "Mark",
      label: "Sliver",
      start: 0,
      length: PUFF,
      beats: { appear: 2 },
    },
    {
      id: "puff",
      lane: "Mark",
      label: "Puff",
      start: PUFF,
      length: WOBBLE - PUFF,
      follows: "sliver",
      beats: { round: 7, roundEnd: 26 - PUFF, glossAt: 2, glossEnd: 9 },
    },
    {
      id: "wobble",
      lane: "Mark",
      label: "Wobble",
      start: WOBBLE,
      length: 30,
      follows: "puff",
      beats: { decay: 6, period: 9 },
    },
    {
      id: "dot",
      lane: "Dot",
      label: "Dot",
      start: DOT,
      length: 12,
      follows: "wobble",
    },
    {
      id: "slide",
      lane: "Wordmark",
      label: "Wordmark",
      start: SLIDE,
      length: 13,
      follows: "dot",
      beats: { move: 11, revealAt: 2 },
    },
  ];
  return elements;
});
