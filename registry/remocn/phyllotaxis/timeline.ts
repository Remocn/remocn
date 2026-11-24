import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The seeds spiral out from the centre, the accent arm lights up, then a
// pulse runs out along the arm, over and over. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type PhyllotaxisElementId = "grow" | "arm" | "pulse";

export interface PhyllotaxisTimingProps {
  growFrames?: number;
  pulseFrames?: number;
}

const GROW_FRAMES = 60;
const PULSE_FRAMES = 45;
/** Frames one seed takes to pop in. */
const POP = 10;

// Seed i of n starts popping in at `length * sqrt(i / n)` into the grow,
// over `pop`. The arm lights over its length; the pulse starts 10 frames
// after the arm and repeats every `period` until the scene ends.
export const phyllotaxisTimeline = defineTimeline<
  PhyllotaxisElementId,
  PhyllotaxisTimingProps
>(
  (
    { growFrames = GROW_FRAMES, pulseFrames = PULSE_FRAMES },
    { length },
  ): TimelineElement<PhyllotaxisElementId>[] => [
    {
      id: "grow",
      lane: "Seeds",
      label: "Seeds spiral out",
      start: 0,
      length: growFrames,
      beats: { pop: POP },
    },
    {
      id: "arm",
      lane: "Arm",
      label: "Arm lights",
      start: growFrames,
      length: 14,
      follows: "grow",
    },
    {
      id: "pulse",
      lane: "Arm",
      label: "Pulse runs the arm",
      start: growFrames + 10,
      length: Math.max(0, length - (growFrames + 10)),
      follows: "grow",
      beats: { period: pulseFrames },
    },
  ],
);
