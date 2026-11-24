import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word sliding in, the sheen sweeping across it and the exit. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type SheenSlideInElementId = "enter" | "sheen" | "exit";

export interface SheenSlideInTimingProps {
  /** Frame the word starts to leave on. */
  exitAt?: number;
}

const EXIT_AT = 60;
/** The word fades in over `FADE_FRAMES` while it slides. */
const FADE_FRAMES = 4;
/** Time constants of the slide: a fast settle and a slow creep. */
const SETTLE_TAU = 2.5;
const CREEP_TAU = 12;
const SHEEN_IN_END = 4;
const SHEEN_SWEEP_END = 48;
const SHEEN_OUT_START = 48;
const SHEEN_OUT_END = 58;
export const EXIT_FRAMES = 4;

// The slide eases out over its `settle` and `creep` time constants, so
// stretching `enter` slows it. The sheen fades in over `in`, sweeps over
// `sweep` and fades out over `out` from `outAt`.
export const sheenSlideInTimeline = defineTimeline<
  SheenSlideInElementId,
  SheenSlideInTimingProps
>(({ exitAt = EXIT_AT }): TimelineElement<SheenSlideInElementId>[] => [
  {
    id: "enter",
    lane: "Word",
    label: "slide in",
    start: 0,
    length: FADE_FRAMES,
    beats: { settle: SETTLE_TAU, creep: CREEP_TAU },
  },
  {
    id: "sheen",
    lane: "Sheen",
    label: "sheen",
    start: 0,
    length: SHEEN_OUT_END,
    beats: {
      in: SHEEN_IN_END,
      sweep: SHEEN_SWEEP_END,
      outAt: SHEEN_OUT_START,
      out: SHEEN_OUT_END - SHEEN_OUT_START,
    },
  },
  {
    id: "exit",
    lane: "Word",
    label: "exit",
    start: exitAt,
    length: EXIT_FRAMES,
  },
]);
