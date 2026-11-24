import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The rings fading in, the slow push, the title and each readout rising in,
// each ring closing (outermost first), and the goal hit: the rings lapping
// past their goal, the check and the pulse, the over-goal percentages.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type ActivityRingsElementId =
  | "stage"
  | "push"
  | "title"
  | `readout:${number}`
  | `ring:${number}`
  | "goal";

interface Ring {
  label: string;
  value: number;
  unit?: string;
  goal?: number;
}

export interface ActivityRingsTimingProps {
  rings?: Ring[];
  fill?: number;
}

export const DEFAULT_RINGS: Ring[] = [
  { label: "Renders", value: 1284, goal: 1.14 },
  { label: "Templates", value: 42, goal: 1.08 },
  { label: "Hours saved", value: 310, goal: 1.05 },
];

/** The rings drawn: the first three, outermost first. */
export function shownRings<R extends Ring>(rings: R[]) {
  return rings.slice(0, 3);
}

const FILL_START = 16;
const RING_GAP = 4;

// `title` raises the heading over its length and draws its rule from
// `rule`. `readout:<i>` raises ring `i`'s label and value; a chain.
// `ring:<i>` closes ring `i` over its length, `RING_GAP` after the one
// outside it; a chain. `goal` starts when the last ring closes: ring `i`
// laps past its goal `lap` × i frames in, the check springs in from
// `check` and draws from `checkAt` to `checkEnd`, the object bumps to
// `bumpPeak` and back by `bumpEnd`, the pulse runs over the length, and
// the over-goal figures rise from `overAt` to `overEnd`, `overStep` apart.
export const activityRingsTimeline = defineTimeline<
  ActivityRingsElementId,
  ActivityRingsTimingProps
>(({ rings = DEFAULT_RINGS, fill = 42 }) => {
  const list = shownRings(rings);
  const fillEnd = (i: number) => FILL_START + fill + i * RING_GAP;
  const HIT = fillEnd(list.length - 1);
  const elements: TimelineElement<ActivityRingsElementId>[] = [
    { id: "stage", lane: "Rings", label: "Fade in", start: 0, length: 22 },
    { id: "push", lane: "Camera", label: "Push", start: 0, length: HIT + 60 },
    {
      id: "title",
      lane: "Readouts",
      label: "Title",
      start: 2,
      length: 18,
      beats: { rule: 4 },
    },
    ...list.map(
      (ring, i): TimelineElement<ActivityRingsElementId> => ({
        id: `readout:${i}`,
        lane: "Readouts",
        label: ring.label,
        start: 8 + (i + 1) * 4,
        length: 18,
        follows: i > 0 ? `readout:${i - 1}` : "title",
      }),
    ),
    ...list.map(
      (ring, i): TimelineElement<ActivityRingsElementId> => ({
        id: `ring:${i}`,
        lane: "Rings",
        label: ring.label,
        start: FILL_START + i * RING_GAP,
        length: fill,
        follows: i > 0 ? `ring:${i - 1}` : undefined,
      }),
    ),
    {
      id: "goal",
      lane: "Rings",
      label: "Goal",
      start: HIT,
      length: 20,
      follows: list.length > 0 ? `ring:${list.length - 1}` : undefined,
      beats: {
        lap: 2,
        check: 1,
        checkAt: 3,
        checkEnd: 13,
        bumpPeak: 5,
        bumpEnd: 16,
        overAt: 4,
        overEnd: 16,
        overStep: 3,
      },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
