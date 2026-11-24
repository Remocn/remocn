import { defineTimeline } from "@/lib/remocn/timeline";

// The card crushes into a wad pose by pose, then flies off pose by pose.
// Frames on the 30 fps scene timeline; the crumple starts at `at`. The ids
// are public: a saved `timing` prop refers to them.

export type CrumpleTossElementId = "crumple" | "toss";

export interface CrumpleTossTimingProps {
  at?: number;
  crumpleSteps?: number;
  tossSteps?: number;
  step?: number;
}

/** Frames one stop-motion pose holds, as `DEFAULT_STEP` in `stop-motion`. */
const STEP = 3;

// Each holds one pose for `step` frames; its length is its poses times
// `step`. The toss follows the crumple.
export const crumpleTossTimeline = defineTimeline<
  CrumpleTossElementId,
  CrumpleTossTimingProps
>(({ at = 0, crumpleSteps = 4, tossSteps = 5, step = STEP }) => [
  {
    id: "crumple",
    lane: "Card",
    label: "crumple",
    start: at,
    length: crumpleSteps * step,
    beats: { step },
  },
  {
    id: "toss",
    lane: "Card",
    label: "toss",
    start: at + crumpleSteps * step,
    length: tossSteps * step,
    follows: "crumple",
    beats: { step },
  },
]);
