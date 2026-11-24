import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dash opening into a pill, the words around it fading away, the pill
// growing, and the camera pushing in and cutting to the takeover. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type InlinePillTakeoverElementId =
  | "expand"
  | "fade"
  | "grow"
  | "push"
  | "cut";

export interface InlinePillTakeoverTimingProps {
  expandFrames?: number;
  pillGrowAt?: number;
  pillGrowFrames?: number;
  outerExitFrames?: number;
  takeoverAt?: number;
}

const EXPAND_FRAMES = 12;
const PILL_GROW_AT = 12;
const PILL_GROW_FRAMES = 24;
const OUTER_EXIT_FRAMES = 18;
const TAKEOVER_AT = 12;
/** The pill's text shows `PILL_TEXT_AT` into the expand. */
const PILL_TEXT_AT = 3;
/** The words around the pill start fading at `OUTER_EXIT_AT`. */
const OUTER_EXIT_AT = 2;
/** The camera pushes in over `PRE_CUT_FRAMES`, then cuts and settles over `TAKEOVER_SETTLE_FRAMES`. */
const PRE_CUT_FRAMES = 12;
const TAKEOVER_SETTLE_FRAMES = 6;

// `push` eases the camera in until a frame before its end; `cut` jumps in
// closer at its start and settles.
export const inlinePillTakeoverTimeline = defineTimeline<
  InlinePillTakeoverElementId,
  InlinePillTakeoverTimingProps
>(
  ({
    expandFrames = EXPAND_FRAMES,
    pillGrowAt = PILL_GROW_AT,
    pillGrowFrames = PILL_GROW_FRAMES,
    outerExitFrames = OUTER_EXIT_FRAMES,
    takeoverAt = TAKEOVER_AT,
  }) => {
    const cutAt = takeoverAt + PRE_CUT_FRAMES;
    const elements: TimelineElement<InlinePillTakeoverElementId>[] = [
      {
        id: "expand",
        lane: "Pill",
        label: "Expand",
        start: 0,
        length: Math.max(expandFrames, 0.001),
        beats: { text: PILL_TEXT_AT },
      },
      {
        id: "fade",
        lane: "Words",
        label: "Fade out",
        start: OUTER_EXIT_AT,
        length: Math.max(outerExitFrames, 2.001) - OUTER_EXIT_AT,
      },
      {
        id: "grow",
        lane: "Pill",
        label: "Grow",
        start: pillGrowAt,
        length: Math.max(pillGrowFrames, 0.001),
      },
      {
        id: "push",
        lane: "Camera",
        label: "Push in",
        start: takeoverAt,
        length: PRE_CUT_FRAMES,
      },
      {
        id: "cut",
        lane: "Camera",
        label: "Takeover",
        start: cutAt,
        length: TAKEOVER_SETTLE_FRAMES,
        follows: "push",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
