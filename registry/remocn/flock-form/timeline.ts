import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The flock forms an arrow, the arrow peels off from its tip as one ribbon,
// and the birds stream back into the remocn mark. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FlockFormElementId = "arrow" | "launch" | "mark";

export interface FlockFormTimingProps {
  /** Spread, in frames, of the birds' arrival into the arrow. */
  stagger?: number;
}

export const FORM1 = 18;
export const STAGGER = 18;
export const FLY_IN = 28;
export const LAUNCH = 74;
export const RELEASE = 24;
export const CRUISE = 20;
export const FLY_IN2 = 28;
export const HOLD = 32;

// Each bird lands in the arrow at `(1 - tip) * spread * 0.85 + hash * jitter`
// and takes `fly` frames; it leaves the arrow at `(1 - tip) * release + hash *
// jitter` after the launch and blends onto the path over `peel`. It lands in
// the mark that much after the mark's start, over `fly`.
export const flockFormTimeline = defineTimeline<
  FlockFormElementId,
  FlockFormTimingProps
>(({ stagger = STAGGER }): TimelineElement<FlockFormElementId>[] => [
  {
    id: "arrow",
    lane: "Arrow",
    label: "form the arrow",
    start: FORM1,
    length: stagger * 0.85 + 3 + FLY_IN,
    beats: { spread: stagger, jitter: 3, fly: FLY_IN },
  },
  {
    id: "launch",
    lane: "Arrow",
    label: "peel off",
    start: LAUNCH,
    length: RELEASE + 2,
    follows: "arrow",
    beats: { release: RELEASE, jitter: 2, peel: 14 },
  },
  {
    id: "mark",
    lane: "Mark",
    label: "land in the mark",
    start: LAUNCH + CRUISE,
    length: RELEASE + 2 + FLY_IN2,
    follows: "launch",
    beats: { fly: FLY_IN2 },
  },
]);
