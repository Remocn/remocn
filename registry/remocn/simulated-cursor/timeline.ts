import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The cursor travels from point to point and rests at each, clicking where a
// point asks for it. Frames on the 30 fps scene timeline, after `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type SimulatedCursorElementId = `leg:${number}`;

export interface CursorPoint {
  x: number;
  y: number;
  hold?: number;
  click?: boolean;
}

export interface SimulatedCursorTimingProps {
  points?: CursorPoint[];
}

export const DEFAULT_POINTS: CursorPoint[] = [
  { x: 200, y: 150, hold: 20 },
  { x: 800, y: 360, hold: 25, click: true },
  { x: 1050, y: 560, hold: 20 },
];

const TRAVEL_PER_LEG = 24;

// Leg i is the trip from point i to point i + 1 and the rest there: the
// cursor moves over `travel`, then holds until the next leg. The click on
// arrival dips over `dip` and its ripple spreads over `ripple`. The first
// leg waits `wait` frames (the first point's hold) before the cursor is let
// go. Each leg follows the one before it.
export const simulatedCursorTimeline = defineTimeline<
  SimulatedCursorElementId,
  SimulatedCursorTimingProps
>(({ points = DEFAULT_POINTS }) => {
  const elements: TimelineElement<SimulatedCursorElementId>[] = [];
  let cursor = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const to = points[i + 1];
    const start = cursor;
    const end = start + TRAVEL_PER_LEG;
    const holdEnd = end + (to.hold ?? 15);
    elements.push({
      id: `leg:${i}`,
      lane: "Cursor",
      label: `to ${to.x}, ${to.y}${to.click ? " (click)" : ""}`,
      start,
      length: holdEnd - start,
      follows: i > 0 ? `leg:${i - 1}` : undefined,
      beats: {
        travel: TRAVEL_PER_LEG,
        wait: i === 0 ? (points[0].hold ?? 0) : 0,
        dip: 14,
        ripple: 24,
      },
    });
    cursor = holdEnd;
  }
  return elements;
});
