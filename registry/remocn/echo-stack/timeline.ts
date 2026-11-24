import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The main word focusing in and the echoes unfolding around it. The echoes'
// drift runs for as long as the scene does and is not an element. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type EchoStackElementId = "main" | "echoes";

/** The scene's timing does not depend on its props. */
export type EchoStackTimingProps = object;

/** The main word focuses in over these frames. */
export const MAIN = [0, 14] as const;
/** The echoes spread out over `UNFOLD` and fade in over `FADE_IN`. */
export const UNFOLD = [8, 26] as const;
export const FADE_IN = [8, 24] as const;

// The echoes fade in from their start over their `fade` beat.
export const echoStackTimeline = defineTimeline<
  EchoStackElementId,
  EchoStackTimingProps
>((): TimelineElement<EchoStackElementId>[] => [
  {
    id: "main",
    lane: "Word",
    label: "main word",
    start: MAIN[0],
    length: MAIN[1] - MAIN[0],
  },
  {
    id: "echoes",
    lane: "Echoes",
    label: "echoes",
    start: UNFOLD[0],
    length: UNFOLD[1] - UNFOLD[0],
    beats: { fade: FADE_IN[1] - FADE_IN[0] },
  },
]);
