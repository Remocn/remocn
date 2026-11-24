import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The redline measure: the UI dimming back, then the rulers and radius arcs
// drawing in one after another. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type RedlineMeasureElementId = "dim" | "marks";

export interface RedlineMeasureTimingProps {
  children?: unknown;
  measures?: unknown[];
  radii?: unknown[];
  stagger?: number;
}

const START = 8;
export const MARK_STAGGER = 5;
// The demo dashboard's rulers and radius arcs (audit-core's `DEMO.before`),
// counted for the length of `marks` only.
const DEMO_RULERS = 7;
const DEMO_ARCS = 1;
// A ruler's label pops in 7 frames after it, an arc's 8; a pop takes 12.
const MARK_LENGTH = 20;

// `dim` fades the UI toward the background. `marks` draws the rulers, then
// the radius arcs, one every `stagger` frames.
export const redlineMeasureTimeline = defineTimeline<
  RedlineMeasureElementId,
  RedlineMeasureTimingProps
>(
  ({
    children,
    measures,
    radii,
    stagger = MARK_STAGGER,
  }): TimelineElement<RedlineMeasureElementId>[] => {
    const count =
      (measures?.length ?? (children ? 0 : DEMO_RULERS)) +
      (radii?.length ?? (children ? 0 : DEMO_ARCS));
    return [
      { id: "dim", lane: "UI", label: "dim", start: 0, length: 10 },
      {
        id: "marks",
        lane: "Marks",
        label: "rulers and arcs",
        start: START,
        length: Math.max(0, count - 1) * stagger + MARK_LENGTH,
        beats: { stagger },
      },
    ];
  },
);
