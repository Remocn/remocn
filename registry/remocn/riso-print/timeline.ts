import { defineTimeline } from "@/lib/remocn/timeline";

// The key plate presses onto the paper, the accent plate slides in off
// register and settles, then the plates start to jitter like a running
// press. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type RisoPrintElementId = "key" | "accent" | "jitter";

/** The print's timing does not depend on its props. */
export type RisoPrintTimingProps = object;

// The accent plate fades in over `fade` while its spring carries it in; the
// jitter grows over its length and runs on to the end.
export const risoPrintTimeline = defineTimeline<
  RisoPrintElementId,
  RisoPrintTimingProps
>(() => [
  { id: "key", lane: "Plates", label: "key plate", start: 0, length: 8 },
  {
    id: "accent",
    lane: "Plates",
    label: "accent plate",
    start: 4,
    length: 22,
    beats: { fade: 4 },
  },
  {
    id: "jitter",
    lane: "Plates",
    label: "jitter",
    start: 26,
    length: 8,
    follows: "accent",
  },
]);
