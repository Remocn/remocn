import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter streaks in from the right. Frames on the 30 fps scene
// timeline. The ids are public: a saved `timing` prop refers to them.

export type StretchInElementId = `letter:${number}`;

export interface StretchInTimingProps {
  text?: string;
  entryStart?: number;
  entryStagger?: number;
  travelFrames?: number;
  vertexLagFrames?: number;
}

export const DEFAULT_TEXT = "REMOCN";
const ENTRY_START = 0;
const ENTRY_STAGGER = 3;
const TRAVEL_FRAMES = 33;
const VERTEX_LAG_FRAMES = 3.5;

// A letter's left edge sets off at its start and its right edge `lag` frames
// later; every vertex travels for `run` frames.
export const stretchInTimeline = defineTimeline<
  StretchInElementId,
  StretchInTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    entryStart = ENTRY_START,
    entryStagger = ENTRY_STAGGER,
    travelFrames = TRAVEL_FRAMES,
    vertexLagFrames = VERTEX_LAG_FRAMES,
  }) => {
    const run = Math.max(1, travelFrames - vertexLagFrames);
    return Array.from(text).map((letter, i) => ({
      id: `letter:${i}`,
      lane: "Letters",
      label: letter,
      start: entryStart + entryStagger * i,
      length: vertexLagFrames + run,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
      beats: { lag: vertexLagFrames, run },
    }));
  },
);
