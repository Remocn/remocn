import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera panning macro-close across the last letters, pulling back to
// the whole headline, then pushing in slowly; the corner label rises early
// on. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type MacroPanElementId = "pan" | "label" | "pull" | "push";

export interface MacroPanTimingProps {
  /** Frames the camera pans across the last letters. */
  panLen?: number;
  /** Frames of the pull-back to the full headline. */
  pullLen?: number;
}

const PAN_END = 100;
const PULL_LEN = 34;
const PUSH_LEN = 50;
const LABEL_AT = 4;
const LABEL_LEN = 18;

// The pull follows the pan, the push follows the pull.
export const macroPanTimeline = defineTimeline<
  MacroPanElementId,
  MacroPanTimingProps
>(({ panLen = PAN_END, pullLen = PULL_LEN }) => {
  const elements: TimelineElement<MacroPanElementId>[] = [
    { id: "pan", lane: "Camera", label: "pan", start: 0, length: panLen },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: LABEL_AT,
      length: LABEL_LEN,
    },
    {
      id: "pull",
      lane: "Camera",
      label: "pull back",
      start: panLen,
      length: pullLen,
      follows: "pan",
    },
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: panLen + pullLen,
      length: PUSH_LEN,
      follows: "pull",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
