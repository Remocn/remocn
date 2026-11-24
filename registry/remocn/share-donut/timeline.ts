import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The share donut: the stage fading up, the slow spin and push of the
// camera, each slice drawing round in turn with its tick and label, the
// highlighted slice detaching while the rest dims, and the centre figure and
// its label landing. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ShareDonutElementId =
  | "stage"
  | "spin"
  | "push"
  | `segment:${number}`
  | "detach"
  | "total"
  | "label";

/** A slice as the schedule reads it (`DonutSegment`). */
export interface DonutSlice {
  label: string;
  value: number;
}

export interface ShareDonutTimingProps {
  segments?: DonutSlice[];
  drawLength?: number;
}

export const DEFAULT_SEGMENTS: DonutSlice[] = [
  { label: "remocn", value: 38 },
  { label: "Kitebase", value: 24 },
  { label: "Lumen", value: 17 },
  { label: "Fernway", value: 12 },
  { label: "Other", value: 9 },
];

const DRAW_START = 6;
const DRAW_LEN = 52;

/** Frames from `a` to `b`, so that `a` plus it lands on `b` exactly. */
const span = (a: number, b: number) => b - a;

// `segment:<i>` draws slice `i` over its length (a share of `drawLength`,
// at least 9 frames); the slices form a chain, each starting 2 frames before
// the one before it ends. Its tick grows from `tickAt` over `tick` and its
// label from `labelAt` over `label`, both counted from the slice's END.
// `detach` follows the last slice, springing the highlight out and dimming
// the rest over its length; `total` follows it, landing over `land` and
// counting over its length; `label` follows the total. `spin` and `push`
// run the camera from the start to just past the detach and far beyond it.
export const shareDonutTimeline = defineTimeline<
  ShareDonutElementId,
  ShareDonutTimingProps
>(({ segments = DEFAULT_SEGMENTS, drawLength = DRAW_LEN }) => {
  const list = segments.slice(0, 5);
  const total = list.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const slices: TimelineElement<ShareDonutElementId>[] = [];
  let clock = DRAW_START;
  let drawEnd = DRAW_START;
  list.forEach((s, i) => {
    const frac = Math.max(0, s.value) / total;
    const dur = Math.max(9, drawLength * frac);
    const start = clock;
    clock += dur - 2;
    drawEnd = start + dur;
    slices.push({
      id: `segment:${i}`,
      lane: "Ring",
      label: s.label,
      start,
      length: dur,
      follows: i > 0 ? `segment:${i - 1}` : undefined,
      beats: { tickAt: -6, tick: 8, labelAt: -4, label: 12 },
    });
  });
  const HIT = drawEnd + 8;
  const elements: TimelineElement<ShareDonutElementId>[] = [
    { id: "stage", lane: "Stage", label: "fade up", start: 0, length: 10 },
    { id: "spin", lane: "Camera", label: "spin", start: 0, length: HIT + 10 },
    { id: "push", lane: "Camera", label: "push", start: 0, length: HIT + 60 },
    ...slices,
    {
      id: "detach",
      lane: "Ring",
      label: "detach",
      start: HIT,
      length: 16,
      follows: list.length ? `segment:${list.length - 1}` : undefined,
    },
    {
      id: "total",
      lane: "Total",
      label: "figure",
      start: HIT + 4,
      length: span(HIT + 4, HIT + 30),
      follows: "detach",
      beats: { land: span(HIT + 4, HIT + 24) },
    },
    {
      id: "label",
      lane: "Total",
      label: "label",
      start: HIT + 12,
      length: span(HIT + 12, HIT + 30),
      follows: "total",
    },
  ];
  return elements;
});
