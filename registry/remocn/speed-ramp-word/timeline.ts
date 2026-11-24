import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The speed ramp down into slow motion, the hang, and the snap back to full
// speed. The phrase rushes in at full speed before the ramp and exits at full
// speed after the snap. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type SpeedRampWordElementId = "ramp" | "hang" | "snap";

// Beat sheet (30fps):
//  0–20    the phrase rushes in from the right at full speed, streaked
//  20–48   speed ramp: a smooth velocity curve down to ~0.5% speed; the key
//          word warms to the accent, trailing ghosts start to gather
//  48–100  the key word hangs, drifting a few pixels; ghosts collapse into it
//  100–110 time snaps back (accelerating curve)
//  110–end the phrase exits left at full speed
const RUSH_END = 20;
const RAMP_LEN = 28;
const HANG_LEN = 52;
const SNAP_LEN = 10;

// The ramp's beats cue the slow-motion look from its start: `slowIn` starts
// the dim and defocus of the rest of the phrase, `ghostsIn` and `ghostsFull`
// bring the ghosts in, `accentIn` starts warming the key word, `drift` starts
// its drift. The hang's `accentFull` ends the warming and `ghostsFade` starts
// folding the ghosts away; the snap's `ghostsGone` and `slowOut` end the
// ghosts and the look. The hang follows the ramp, the snap the hang; the
// phrase's key word is centred in the middle of the hang.
export const speedRampWordTimeline = defineTimeline<
  SpeedRampWordElementId,
  object
>((): TimelineElement<SpeedRampWordElementId>[] => [
  {
    id: "ramp",
    lane: "Speed",
    label: "ramp down",
    start: RUSH_END,
    length: RAMP_LEN,
    beats: {
      slowIn: 6,
      ghostsIn: 8,
      accentIn: 10,
      drift: RAMP_LEN - 6,
      ghostsFull: RAMP_LEN - 4,
    },
  },
  {
    id: "hang",
    lane: "Speed",
    label: "hang",
    start: RUSH_END + RAMP_LEN,
    length: HANG_LEN,
    follows: "ramp",
    beats: { accentFull: 2, ghostsFade: HANG_LEN - 6 },
  },
  {
    id: "snap",
    lane: "Speed",
    label: "snap back",
    start: RUSH_END + RAMP_LEN + HANG_LEN,
    length: SNAP_LEN,
    follows: "hang",
    beats: { ghostsGone: 2, slowOut: 6 },
  },
]);
