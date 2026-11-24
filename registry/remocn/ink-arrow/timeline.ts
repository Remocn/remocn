import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The shaft brushing on, then the head's two arms flicking out one after the
// other. Frames on the 30 fps scene timeline; `delay` is where the shaft
// starts. The ids are public: a saved `timing` prop refers to them.

export type InkArrowElementId = "shaft" | "head";

export interface InkArrowTimingProps {
  delay?: number;
  drawDur?: number;
  headDur?: number;
  step?: number;
}

/** Frames each stop-motion pose holds, as in `@/lib/remocn/stop-motion`. */
const STEP = 3;

// `head` follows the shaft: the left arm draws until `mid`, the right arm
// from `mid` to the end.
export const inkArrowTimeline = defineTimeline<
  InkArrowElementId,
  InkArrowTimingProps
>(({ delay = 0, drawDur = 36, headDur, step = STEP }) => {
  const headFrames = headDur ?? step * 4;
  const out: TimelineElement<InkArrowElementId>[] = [
    {
      id: "shaft",
      lane: "Arrow",
      label: "shaft",
      start: delay,
      length: drawDur,
    },
    {
      id: "head",
      lane: "Arrow",
      label: "head",
      start: delay + drawDur,
      length: headFrames,
      follows: "shaft",
      beats: { mid: headFrames / 2 },
    },
  ];
  return out;
});
