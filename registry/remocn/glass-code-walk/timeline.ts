import { defineTimeline } from "@/lib/remocn/timeline";

// The camera walks down the code line by line, zoomed in, then pulls back to
// the whole block. Frames on the 30 fps scene timeline, after `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type GlassCodeWalkElementId = "scan" | "pull-back";

export interface GlassCodeWalkTimingProps {
  code?: string;
  staggerFrames?: number;
}

/** Lines in the component's default `code`. */
const DEFAULT_CODE_LINES = 10;
const STAGGER_FRAMES = 10;
const PULL_BACK_FRAMES = 24;

// The scan tracks from the first line to the last, one line every
// `staggerFrames`, in step with the block revealing them; the pull-back
// follows it.
export const glassCodeWalkTimeline = defineTimeline<
  GlassCodeWalkElementId,
  GlassCodeWalkTimingProps
>(({ code, staggerFrames = STAGGER_FRAMES }) => {
  const lineCount =
    code === undefined ? DEFAULT_CODE_LINES : code.split("\n").length;
  const scanEnd = (lineCount - 1) * staggerFrames;
  return [
    {
      id: "scan",
      lane: "Camera",
      label: "Camera walks the lines",
      start: 0,
      length: scanEnd,
    },
    {
      id: "pull-back",
      lane: "Camera",
      label: "Camera pulls back",
      start: scanEnd,
      length: PULL_BACK_FRAMES,
      follows: "scan",
    },
  ];
});
