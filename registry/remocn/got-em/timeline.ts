import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pending line with its spinner, the dead stop, then GOT 'EM exploding
// and the subline rising. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type GotEmElementId = "intro" | "spinner" | "pause" | "boom" | "subline";

export interface GotEmTimingProps {
  /** Frames of dead stop before the boom. */
  pause?: number;
}

const INTRO = 12;
const PAUSE_AT = 48;
const PAUSE = 14;
/** The boom zooms in over `BOOM`; the title lands over `TITLE`. */
const BOOM = 8;
const TITLE = 6;
const FLASH = 5;
const DRIFT = 70;
/** The subline rises `SUBLINE_AT` after the boom, over `SUBLINE`. */
const SUBLINE_AT = 12;
const SUBLINE = 16;
/** The ring settles over `SETTLE` once paused. */
const SETTLE = 6;

// The spinner sweeps until the pause stops it dead.
export const gotEmTimeline = defineTimeline<GotEmElementId, GotEmTimingProps>(
  ({ pause = PAUSE }): TimelineElement<GotEmElementId>[] => {
    const boomAt = PAUSE_AT + pause;
    return [
      { id: "intro", lane: "Pending", label: "intro", start: 0, length: INTRO },
      {
        id: "spinner",
        lane: "Spinner",
        label: "spinner",
        start: 0,
        length: PAUSE_AT,
      },
      {
        id: "pause",
        lane: "Spinner",
        label: "pause",
        start: PAUSE_AT,
        length: pause,
        follows: "spinner",
        beats: { settle: SETTLE },
      },
      {
        id: "boom",
        lane: "Boom",
        label: "boom",
        start: boomAt,
        length: BOOM,
        follows: "pause",
        beats: { title: TITLE, flash: FLASH, drift: DRIFT },
      },
      {
        id: "subline",
        lane: "Subline",
        label: "subline",
        start: boomAt + SUBLINE_AT,
        length: SUBLINE,
        follows: "boom",
      },
    ];
  },
);
