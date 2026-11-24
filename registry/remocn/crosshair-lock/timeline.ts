import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The axis fading in, the dot columns rising left to right, the vertical
// and horizontal hairlines gliding onto the peak, then the lock, the bloom
// of the peak's gradient, the leader line and the callout popping in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type CrosshairLockElementId =
  | "axis"
  | "columns"
  | "vertical"
  | "horizontal"
  | "bloom"
  | "lock"
  | "leader"
  | "callout";

export interface CrosshairLockTimingProps {
  slide?: number;
}

const V_AT = 14;
const H_AT = 18;
const SLIDE = 26;

// In `columns` each column starts rising by its place across `spread` and
// takes `each`. The hairlines fade in over `on` while they glide. The lock
// lands when the horizontal one arrives: the bloom and the lock follow it,
// the leader follows the lock and the callout follows the leader.
export const crosshairLockTimeline = defineTimeline<
  CrosshairLockElementId,
  CrosshairLockTimingProps
>(({ slide = SLIDE }): TimelineElement<CrosshairLockElementId>[] => {
  const LOCK = H_AT + slide;
  const LEAD_AT = LOCK + 8;
  const POP_AT = LEAD_AT + 10;
  const elements: TimelineElement<CrosshairLockElementId>[] = [
    { id: "axis", lane: "Chart", label: "axis", start: 0, length: 10 },
    {
      id: "columns",
      lane: "Chart",
      label: "columns rise",
      start: 0,
      length: 26,
      beats: { spread: 14, each: 12 },
    },
    {
      id: "vertical",
      lane: "Crosshair",
      label: "vertical glide",
      start: V_AT,
      length: slide,
      beats: { on: 6 },
    },
    {
      id: "horizontal",
      lane: "Crosshair",
      label: "horizontal glide",
      start: H_AT,
      length: slide,
      beats: { on: 6 },
    },
    {
      id: "bloom",
      lane: "Chart",
      label: "bloom",
      start: LOCK - 2,
      length: 36,
      follows: "horizontal",
    },
    {
      id: "lock",
      lane: "Lock",
      label: "lock",
      start: LOCK,
      length: 20,
      follows: "horizontal",
    },
    {
      id: "leader",
      lane: "Callout",
      label: "leader line",
      start: LEAD_AT,
      length: 14,
      follows: "lock",
    },
    {
      id: "callout",
      lane: "Callout",
      label: "callout",
      start: POP_AT,
      length: 8,
      follows: "leader",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
