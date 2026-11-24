import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lead word rising in, the track sliding over to the value, and the
// value's outline filling in. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type OutlineFillTrackTextElementId = "enter" | "track" | "fill";

export interface OutlineFillTrackTextTimingProps {
  /** Frames the value's fill takes once the value shows. */
  fillDuration?: number;
}

const FILL_DURATION = 38;
const ENTER_END = 16;
const TRACK_START = 16;
const TRACK_END = 72;
/** The value shows on `FILL_START`; its fill starts `FILL_PREFILL` earlier. */
const FILL_START = 34;
const FILL_PREFILL = 10;

// The track and the fill follow the lead word: stretching its rise moves
// both. The value outline shows `show` into the fill.
export const outlineFillTrackTextTimeline = defineTimeline<
  OutlineFillTrackTextElementId,
  OutlineFillTrackTextTimingProps
>(
  ({
    fillDuration = FILL_DURATION,
  }): TimelineElement<OutlineFillTrackTextElementId>[] => {
    const safeFillDuration = Math.max(fillDuration, 1);
    return [
      {
        id: "enter",
        lane: "Lead",
        label: "lead word",
        start: 0,
        length: ENTER_END,
      },
      {
        id: "track",
        lane: "Track",
        label: "track",
        start: TRACK_START,
        length: TRACK_END - TRACK_START,
        follows: "enter",
      },
      {
        id: "fill",
        lane: "Value",
        label: "value fill",
        start: FILL_START - FILL_PREFILL,
        length: FILL_PREFILL + safeFillDuration,
        follows: "enter",
        beats: { show: FILL_PREFILL },
      },
    ];
  },
);
