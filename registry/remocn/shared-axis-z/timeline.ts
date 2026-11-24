import { defineTimeline } from "@/lib/remocn/timeline";

// When the old line zooms out and the new one settles in. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SharedAxisZElementId = "out" | "in";

/** The scene's timing does not depend on its props. */
export type SharedAxisZTimingProps = object;

const EXIT = 11;
const ENTER = 16;
const OVERLAP = 3;
const MICRO_DELAY = 1;

// The new line starts `OVERLAP - MICRO_DELAY` frames before the old one is
// gone, and follows it.
export const sharedAxisZTimeline = defineTimeline<
  SharedAxisZElementId,
  SharedAxisZTimingProps
>(() => {
  const exitTotal = EXIT;
  const newStart = Math.max(0, exitTotal - OVERLAP + MICRO_DELAY);
  return [
    { id: "out", lane: "Out", label: "from text", start: 0, length: EXIT },
    {
      id: "in",
      lane: "In",
      label: "to text",
      start: newStart,
      length: ENTER,
      follows: "out",
    },
  ];
});
