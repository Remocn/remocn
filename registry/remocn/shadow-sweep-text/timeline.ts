import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The text drifting up into place while a soft shadow sweeps across it,
// uncovering it, then sweeps again to cover it. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type ShadowSweepTextElementId = "travel" | "enter" | "exit";

export interface ShadowSweepTextTimingProps {
  text: string;
}

/** Frames the whole animation takes, its last frame included. */
export const SHADOW_SWEEP_TEXT_LENGTH = 37;
const ENTER_END = 23;
/** The uncovering sweep starts this far before the scene does. */
const ENTER_LEAD = -3;
const EXIT_START = 26;
const EXIT_END = SHADOW_SWEEP_TEXT_LENGTH - 1;

// The drift runs the whole animation. The covering sweep follows the
// uncovering one, three frames after it ends.
export const shadowSweepTextTimeline = defineTimeline<
  ShadowSweepTextElementId,
  ShadowSweepTextTimingProps
>(({ text }) => {
  const elements: TimelineElement<ShadowSweepTextElementId>[] = [
    {
      id: "travel",
      lane: "Drift",
      label: text,
      start: 0,
      length: SHADOW_SWEEP_TEXT_LENGTH - 1,
    },
    {
      id: "enter",
      lane: "Sweep",
      label: "uncover",
      start: 0,
      length: ENTER_END,
      beats: { lead: ENTER_LEAD },
    },
    {
      id: "exit",
      lane: "Sweep",
      label: "cover",
      start: EXIT_START,
      length: EXIT_END - EXIT_START,
      follows: "enter",
    },
  ];
  return elements;
});
