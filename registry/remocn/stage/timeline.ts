import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The plane settling into the stage, then the camera moving from each key
// of `moves` to the next. Frames on the 30 fps scene timeline. The ids are
// public: a saved `timing` prop refers to them.

export type StageElementId = "entry" | `move:${number}`;

/** A camera key, as far as its timing goes (`StageKey`). */
export interface StageTimingKey {
  at: number;
}

export interface StageTimingProps {
  moves?: StageTimingKey[];
}

const ENTRY = 24;
const FADE = 9;

/** Keys in time order; when two share a frame, the last one supplied wins. */
export function stageKeyOrder<K extends StageTimingKey>(moves: K[]): K[] {
  const byFrame = new Map<number, K>();
  for (const move of moves) byFrame.set(move.at, move);
  return [...byFrame.values()].sort((a, b) => a.at - b.at);
}

// `entry` settles the plane in, fading it up over `fade`. `move:<i>` runs
// from key `i` to key `i + 1`, a chain; a hold is a move between two equal
// keys.
export const stageTimeline = defineTimeline<StageElementId, StageTimingProps>(
  ({ moves = [] }) => {
    const keys = stageKeyOrder(moves);
    const elements: TimelineElement<StageElementId>[] = [
      {
        id: "entry",
        lane: "Entry",
        label: "settle in",
        start: 0,
        length: ENTRY,
        beats: { fade: FADE },
      },
      ...keys.slice(1).map(
        (key, i): TimelineElement<StageElementId> => ({
          id: `move:${i}`,
          lane: "Camera",
          label: `key ${i + 1} to ${i + 2}`,
          start: keys[i].at,
          length: key.at - keys[i].at,
          follows: i > 0 ? `move:${i - 1}` : undefined,
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
