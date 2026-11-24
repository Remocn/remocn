import { defineTimeline } from "@/lib/remocn/timeline";

// The text settling in, then scaling down and fading out at the end of the
// clip. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type ScaleDownFadeElementId = "enter" | "exit";

export interface ScaleDownFadeTimingProps {
  text: string;
}

const ENTER = 16;
const EXIT = 11;

// The exit ends on the last frame of the scene, never before the enter ends.
export const scaleDownFadeTimeline = defineTimeline<
  ScaleDownFadeElementId,
  ScaleDownFadeTimingProps
>(({ text }, { length }) => {
  const exitStart = Math.max(ENTER, length - EXIT);
  return [
    { id: "enter", lane: "Text", label: text, start: 0, length: ENTER },
    {
      id: "exit",
      lane: "Text",
      label: text,
      start: exitStart,
      length: length - exitStart,
    },
  ];
});
