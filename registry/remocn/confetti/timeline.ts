import { defineTimeline } from "@/lib/remocn/timeline";

// The one burst of confetti, from the frame it fires until the last piece
// has faded. Frames on the 30 fps scene timeline. The ids are public: a
// saved `timing` prop refers to them.

export type ConfettiElementId = "burst";

export interface ConfettiTimingProps {
  /** Frame the burst fires on. */
  startFrame?: number;
  /** Lifetime of the burst, in frames. */
  lifetime?: number;
}

// Stretching `burst` slows nothing down: the pieces fly on the same arcs and
// only fade out over the longer lifetime.
export const confettiTimeline = defineTimeline<
  ConfettiElementId,
  ConfettiTimingProps
>(({ startFrame = 0, lifetime = 90 }) => [
  {
    id: "burst",
    lane: "Confetti",
    label: "burst",
    start: startFrame,
    length: lifetime,
  },
]);
