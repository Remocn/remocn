import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lap clock running, the freeze (the band growing out of the sector
// line), the band's blink and the delta dropping in under it. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SplitFlashElementId = "run" | "freeze" | "blink" | "delta";

export interface SplitFlashTimingProps {
  freezeAt?: number;
}

export const RUN = 42;
const GROW_LEN = 2;
const BLINK_AT = 4;
const BLINK_LEN = 2;
const DELTA_AT = 8;
const DELTA_LEN = 9;

// `run` ends on the frame the clock freezes on its final time. `freeze`
// grows the band, whose sheen drifts for `sheen`; `blink` turns it off and
// back on; `delta` slides out from under it. All three follow the run.
export const splitFlashTimeline = defineTimeline<
  SplitFlashElementId,
  SplitFlashTimingProps
>(({ freezeAt = RUN }): TimelineElement<SplitFlashElementId>[] => [
  { id: "run", lane: "Clock", label: "clock runs", start: 0, length: freezeAt },
  {
    id: "freeze",
    lane: "Band",
    label: "freeze",
    start: freezeAt,
    length: GROW_LEN,
    follows: "run",
    beats: { sheen: 60 },
  },
  {
    id: "blink",
    lane: "Band",
    label: "blink",
    start: freezeAt + BLINK_AT,
    length: BLINK_LEN,
    follows: "run",
  },
  {
    id: "delta",
    lane: "Delta",
    label: "delta",
    start: freezeAt + DELTA_AT,
    length: DELTA_LEN,
    follows: "run",
  },
]);
