import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line draws on from its start, its wiggle calms and swims while it
// settles, it holds, then erases from the start. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SquiggleElementId = "draw" | "settle" | "erase";

export interface SquiggleTimingProps {
  hold?: number;
  erase?: boolean;
}

const DRAW = 24;
export const SETTLE = 36;
export const ERASE = 18;
export const HOLD = 12;

/** The hold, as the scene reads it: a finite count of frames, at least 0. */
export const holdOf = (value: number | undefined) =>
  Math.max(
    0,
    typeof value === "number" && Number.isFinite(value) ? value : HOLD,
  );

// The draw and the settle both start on frame 0; the erase follows the
// settle after `hold` frames. Without `erase` the line stays drawn.
export const squiggleTimeline = defineTimeline<
  SquiggleElementId,
  SquiggleTimingProps
>((props) => {
  const elements: TimelineElement<SquiggleElementId>[] = [
    { id: "draw", lane: "Line", label: "draw", start: 0, length: DRAW },
    { id: "settle", lane: "Motion", label: "settle", start: 0, length: SETTLE },
  ];
  if (props.erase !== false) {
    elements.push({
      id: "erase",
      lane: "Line",
      label: "erase",
      start: SETTLE + holdOf(props.hold),
      length: ERASE,
      follows: "settle",
    });
  }
  return elements;
});
