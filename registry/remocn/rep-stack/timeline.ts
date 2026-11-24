import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The reel of copies running up and braking into the gate, the last copy
// settling into it, the echoes dimming back, and the horizon glow drifting
// under it all. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type RepStackElementId = "run" | "glow" | "settle" | "dim";

export interface RepStackTimingProps {
  /** Frames the reel of copies runs before it brakes into the gate. */
  runLength?: number;
}

const RUN_LEN = 42;
const SETTLE_LEN = 8;
const DIM_AT = 48;
const DIM_LEN = 12;
const GLOW_LEN = 90;

// The settle and the dim follow the run: they hang off the moment it brakes.
export const repStackTimeline = defineTimeline<
  RepStackElementId,
  RepStackTimingProps
>(({ runLength = RUN_LEN }) => {
  const dimAt = DIM_AT + (runLength - RUN_LEN);
  const elements: TimelineElement<RepStackElementId>[] = [
    { id: "run", lane: "Reel", label: "run", start: 0, length: runLength },
    {
      id: "glow",
      lane: "Glow",
      label: "glow drift",
      start: 0,
      length: GLOW_LEN,
    },
    {
      id: "settle",
      lane: "Reel",
      label: "settle",
      start: runLength,
      length: SETTLE_LEN,
      follows: "run",
    },
    {
      id: "dim",
      lane: "Echoes",
      label: "dim echoes",
      start: dimAt,
      length: DIM_LEN,
      follows: "run",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
