import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The gradient wiping across the word, the giant word drifting left, and the
// cut to the compact word settling in place. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type GradientScaleCutTextElementId = "reveal" | "giant" | "compact";

export interface GradientScaleCutTextTimingProps {
  /** Frame the giant word cuts to the compact one. */
  cutFrame?: number;
}

const CUT_FRAME = 13;
/** The gradient finishes its wipe on this frame. */
const REVEAL_END = 33;
/** The compact word sheds its blur over `SETTLE_FRAMES` after the cut. */
const SETTLE_FRAMES = 8;
/** Its slide holds a frame, then eases through these keys from the cut. */
const MOVE_AT = 1;
const MOVE_MID = 2;
const MOVE_LATE = 4;

// The giant word travels until the frame before the cut; the compact word
// follows it, so stretching the giant word moves the cut.
export const gradientScaleCutTextTimeline = defineTimeline<
  GradientScaleCutTextElementId,
  GradientScaleCutTextTimingProps
>(
  ({
    cutFrame = CUT_FRAME,
  }): TimelineElement<GradientScaleCutTextElementId>[] => {
    const safeCutFrame = Math.max(cutFrame, 1);
    return [
      {
        id: "reveal",
        lane: "Gradient",
        label: "gradient wipe",
        start: 0,
        length: REVEAL_END,
      },
      {
        id: "giant",
        lane: "Word",
        label: "giant word",
        start: 0,
        length: Math.max(safeCutFrame - 1, 1),
      },
      {
        id: "compact",
        lane: "Word",
        label: "compact word",
        start: safeCutFrame,
        length: SETTLE_FRAMES,
        follows: "giant",
        beats: { moveAt: MOVE_AT, moveMid: MOVE_MID, moveLate: MOVE_LATE },
      },
    ];
  },
);
