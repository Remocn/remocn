import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The floor rule, the letters dropping one by one into a tower, the tower
// rocking, then toppling and every letter landing in a row. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type StackLettersElementId =
  | "rule"
  | `char:${number}`
  | "rock"
  | "topple";

export interface StackLettersTimingProps {
  word?: string;
  /** Frames between letters dropping onto the stack. */
  stagger?: number;
  /** Frames the full stack stands before it rocks and topples. */
  hold?: number;
}

export const DEFAULT_WORD = "STACK";
const DROP_GAP = 8;
const HOLD = 9;
const RULE_IN = 14;
/** A letter falls onto the stack over `FALL`. */
const FALL = 12;
const ROCK = 10;
/** The tower tips over in `TOPPLE` frames to a right angle. */
const TOPPLE = 22;
/** Letters let go at this tilt... */
export const DETACH_DEG = 20;
/** ...and land `LAND` after letting go, `LAND_GAP` apart. */
const LAND = 7;
const LAND_GAP = 4;
/** The light keeps drifting until this long after the last landing. */
const GLOW_TAIL = 30;

/** When the letters let go of the toppling tower, from its start. */
function releaseAfter(topple: number) {
  return topple * Math.sqrt(DETACH_DEG / 95);
}

// `topple` runs from the tower tipping to the last letter landing; `topple`
// (the beat) is the time to a right angle, and the physics scales with it.
export const stackLettersTimeline = defineTimeline<
  StackLettersElementId,
  StackLettersTimingProps
>(({ word = DEFAULT_WORD, stagger = DROP_GAP, hold = HOLD }) => {
  const n = Array.from(word).length;
  const drop = (k: number) => k * stagger - 6;
  const lastStack = drop(n - 1) + FALL;
  const rockAt = lastStack + hold;
  const toppleAt = rockAt + ROCK;
  const release = toppleAt + releaseAfter(TOPPLE);
  const lastLand = release + LAND + (n - 1) * LAND_GAP;
  const elements: TimelineElement<StackLettersElementId>[] = [
    { id: "rule", lane: "Floor", label: "rule", start: 0, length: RULE_IN },
    ...Array.from(word).map(
      (char, k): TimelineElement<StackLettersElementId> => ({
        id: `char:${k}`,
        lane: "Letters",
        label: char,
        start: drop(k),
        length: FALL,
        follows: k > 0 ? `char:${k - 1}` : undefined,
      }),
    ),
    {
      id: "rock",
      lane: "Tower",
      label: "rock",
      start: rockAt,
      length: ROCK,
      follows: n > 0 ? `char:${n - 1}` : undefined,
    },
    {
      id: "topple",
      lane: "Tower",
      label: "topple",
      start: toppleAt,
      length: lastLand - toppleAt,
      follows: "rock",
      beats: {
        topple: TOPPLE,
        land: LAND,
        landGap: LAND_GAP,
        glow: GLOW_TAIL,
      },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
