import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The two halves of the lockup slamming together, the click with its flash
// and shake, then the label typing in underneath. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SnapClickElementId = "slam" | "click" | "type";

export interface SnapClickTimingProps {
  label?: string;
  click?: number;
}

export const DEFAULT_LABEL = "Animations for Remotion";
/** Characters of the label typed per frame. */
export const TYPE_RATE = 1.1;

// `slam` pushes the halves together. `click` snaps them: an overshoot until
// `overshoot`, a rebound until `rebound`, the shake from `shake`, and the
// flash over its length. `type` types the label (the caret shows from `caret`,
// blinks every `blink` once done); `stream` is a unit beat whose stretch slows
// the typing. Each follows the one before.
export const snapClickTimeline = defineTimeline<
  SnapClickElementId,
  SnapClickTimingProps
>(({ label = DEFAULT_LABEL, click = 13 }) => {
  const elements: TimelineElement<SnapClickElementId>[] = [
    { id: "slam", lane: "Lockup", label: "Slam", start: 0, length: click },
    {
      id: "click",
      lane: "Lockup",
      label: "Click",
      start: click,
      length: 9,
      follows: "slam",
      beats: { overshoot: 1, rebound: 2, shake: 1 },
    },
    {
      id: "type",
      lane: "Label",
      label,
      start: click + 11,
      length: Math.max(1, label.length / TYPE_RATE),
      follows: "click",
      beats: { caret: -4, blink: 9, stream: 1 },
    },
  ];
  return elements;
});
