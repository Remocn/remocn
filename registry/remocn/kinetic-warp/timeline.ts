import { defineTimeline } from "@/lib/remocn/timeline";

// The mesh warp's five moves, one keyframe stride each: the middle column
// sliding right, the middle row dropping, the column sliding left, the row
// rising, and both easing home. Frames on the 30 fps scene timeline. The ids
// are public: a saved `timing` prop refers to them.

export type KineticWarpElementId = "right" | "down" | "left" | "up" | "home";

export interface KineticWarpTimingProps {
  keyframeStride?: number;
}

const KEYFRAME_STRIDE = 20;

/** The moves in order; each runs from one keyframe to the next. */
export const KINETIC_WARP_MOVES = [
  "right",
  "down",
  "left",
  "up",
  "home",
] as const satisfies readonly KineticWarpElementId[];

const LABELS: Record<KineticWarpElementId, string> = {
  right: "Column right",
  down: "Row down",
  left: "Column left",
  up: "Row up",
  home: "Home",
};

// Each move follows the one before it.
export const kineticWarpTimeline = defineTimeline<
  KineticWarpElementId,
  KineticWarpTimingProps
>(({ keyframeStride = KEYFRAME_STRIDE }) =>
  KINETIC_WARP_MOVES.map((id, k) => ({
    id,
    lane: "Warp",
    label: LABELS[id],
    start: k * keyframeStride,
    length: keyframeStride,
    follows: k > 0 ? KINETIC_WARP_MOVES[k - 1] : undefined,
  })),
);
