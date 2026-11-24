import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The ticker tape: the bands running at full tilt, braking until the middle
// band stops with the hero symbol centred, then the side bands clearing out
// and the hero quote rising into the poster. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TickerTapeElementId = "brake" | "rise";

/** The scene's timing does not depend on its props. */
export type TickerTapeTimingProps = object;

// The bands run at full speed until `brake` starts; the hero band stops dead
// at its end, band `i` of the others slows to its crawl `rowStop + i *
// rowGap` after that end. `rise` scales the hero quote into the poster: the
// side bands clear from `clearAt` over `clear`, the caption lines come in
// from `captionAt` over `caption`, and the glow under it fades in over
// `glow`.
export const tickerTapeTimeline = defineTimeline<
  TickerTapeElementId,
  TickerTapeTimingProps
>((): TimelineElement<TickerTapeElementId>[] => [
  {
    id: "brake",
    lane: "Bands",
    label: "brake",
    start: 40,
    length: 46,
    beats: { rowStop: -8, rowGap: 3 },
  },
  {
    id: "rise",
    lane: "Poster",
    label: "poster rises",
    start: 84,
    length: 26,
    follows: "brake",
    beats: { clearAt: -4, clear: 24, captionAt: 20, caption: 20, glow: 40 },
  },
]);
