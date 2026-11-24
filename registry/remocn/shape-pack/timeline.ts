import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The poster packing itself: the grid guides fading in, each block falling
// into its slot, the accent stat block dropping in last and locking the
// poster (the guides flash and fade), the slow push in, and the stat, its
// count and its label rising in the accent block. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type ShapePackElementId =
  | "guides"
  | `block:${number}`
  | "slot"
  | "lock"
  | "push"
  | "stat"
  | "count"
  | "label";

export interface ShapePackTimingProps {
  fall?: number;
}

export interface Block {
  key: string;
  c: number;
  r: number;
  w: number;
  h: number;
  tone: number;
  at: number;
}

const FALL = 14;
const ACCENT_FALL = 11;

export const BLOCKS: Block[] = [
  { key: "b1", c: 0, r: 5, w: 4, h: 3, tone: 1, at: 8 },
  { key: "b2", c: 4, r: 5, w: 3, h: 3, tone: 2, at: 13 },
  { key: "g", c: 9, r: 4, w: 3, h: 4, tone: 3, at: 18 },
  { key: "h", c: 7, r: 5, w: 2, h: 3, tone: 4, at: 23 },
  { key: "a", c: 0, r: 0, w: 4, h: 5, tone: 0, at: 29 },
  { key: "e", c: 4, r: 3, w: 3, h: 2, tone: 5, at: 35 },
  { key: "d", c: 9, r: 0, w: 3, h: 4, tone: 6, at: 41 },
  { key: "f", c: 7, r: 3, w: 2, h: 2, tone: 1, at: 47 },
];
export const SLOT = { c: 4, r: 0, w: 5, h: 3, at: 62 };
const LOCK = SLOT.at + ACCENT_FALL;

// `block:<i>` falls over its length (`fall`); the blocks form a chain.
// `slot` is the accent block's fall; everything after it follows it.
// `lock` fades the guides out, with their flash peaking at `flashPeak` and
// gone by `flash`. `push` is the camera's slow push in from the lock.
export const shapePackTimeline = defineTimeline<
  ShapePackElementId,
  ShapePackTimingProps
>(({ fall = FALL }) => {
  const elements: TimelineElement<ShapePackElementId>[] = [
    { id: "guides", lane: "Grid", label: "guides in", start: 0, length: 14 },
  ];
  BLOCKS.forEach((b, i) => {
    elements.push({
      id: `block:${i}`,
      lane: "Blocks",
      label: b.key,
      start: b.at,
      length: fall,
      follows: i > 0 ? `block:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "slot",
      lane: "Blocks",
      label: "accent block",
      start: SLOT.at,
      length: ACCENT_FALL,
      follows: `block:${BLOCKS.length - 1}`,
    },
    {
      id: "lock",
      lane: "Grid",
      label: "lock",
      start: LOCK,
      length: 18,
      follows: "slot",
      beats: { flashPeak: 2, flash: 10 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: LOCK,
      length: 70,
      follows: "slot",
    },
    {
      id: "stat",
      lane: "Stat",
      label: "stat",
      start: LOCK + 2,
      length: 14,
      follows: "slot",
    },
    {
      id: "count",
      lane: "Stat",
      label: "count",
      start: LOCK + 4,
      length: 26,
      follows: "stat",
    },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: LOCK + 10,
      length: 16,
      follows: "stat",
    },
  );
  return elements;
});
