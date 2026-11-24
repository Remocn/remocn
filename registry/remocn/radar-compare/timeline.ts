import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid fading in with its spokes, rings and axis labels, the slow push,
// the competitor's outline drawing round and filling, the brand's shape
// growing out vertex by vertex, the competitor settling back, the chart
// sliding left and the brand name, caption and legend rising in beside it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type RadarCompareElementId =
  | "enter"
  | "push"
  | `spoke:${number}`
  | `ring:${number}`
  | `label:${number}`
  | "competitor"
  | "brand"
  | `vertex:${number}`
  | "settle"
  | "slide"
  | "name"
  | "caption"
  | "legend";

export interface RadarCompareTimingProps {
  axes?: string[];
  stagger?: number;
  rings?: number;
}

export const DEFAULT_AXES = [
  "Speed",
  "Quality",
  "Price",
  "Support",
  "Integrations",
  "Docs",
];
export const RINGS = [0.25, 0.5, 0.75, 1];

/** The ring radii, as fractions of the chart radius. */
export function ringsOf(rings: number) {
  return rings === RINGS.length
    ? RINGS
    : Array.from({ length: Math.max(1, rings) }, (_, j) => (j + 1) / rings);
}

// `enter` fades the grid in and `push` scales the scene up over its length.
// `spoke:<i>`, `ring:<j>` and `label:<i>` draw the spokes, rings and axis
// labels, each list a chain. `competitor` draws its outline over its length
// and fills it from `fillAt` to `fillEnd`. `brand` fades the brand shape in;
// `vertex:<i>` springs vertex `i` out from its start, a chain. `settle` dims
// the competitor, `slide` moves the chart left, and `name`, `caption` and
// `legend` rise in beside it, one after another.
export const radarCompareTimeline = defineTimeline<
  RadarCompareElementId,
  RadarCompareTimingProps
>(({ axes = DEFAULT_AXES, stagger = 1.8, rings = RINGS.length }) => {
  const list = axes.slice(0, 8);
  const n = Math.max(3, list.length);
  const ringList = ringsOf(rings);
  const elements: TimelineElement<RadarCompareElementId>[] = [
    { id: "enter", lane: "Grid", label: "Fade in", start: 0, length: 8 },
    { id: "push", lane: "Camera", label: "Push in", start: 0, length: 150 },
    ...list.map(
      (ax, i): TimelineElement<RadarCompareElementId> => ({
        id: `spoke:${i}`,
        lane: "Spokes",
        label: ax,
        start: 2 + i * 2,
        length: 20,
        follows: i > 0 ? `spoke:${i - 1}` : undefined,
      }),
    ),
    ...ringList.map(
      (_, j): TimelineElement<RadarCompareElementId> => ({
        id: `ring:${j}`,
        lane: "Rings",
        label: `Ring ${j + 1}`,
        start: 6 + j * 3,
        length: 20,
        follows: j > 0 ? `ring:${j - 1}` : undefined,
      }),
    ),
    ...list.map(
      (ax, i): TimelineElement<RadarCompareElementId> => ({
        id: `label:${i}`,
        lane: "Labels",
        label: ax,
        start: 10 + i * 2,
        length: 20,
        follows: i > 0 ? `label:${i - 1}` : undefined,
      }),
    ),
    {
      id: "competitor",
      lane: "Competitor",
      label: "Competitor",
      start: 22,
      length: 30,
      beats: { fillAt: 20, fillEnd: 38 },
    },
    {
      id: "brand",
      lane: "Brand",
      label: "Brand",
      start: 56,
      length: 6,
      follows: "competitor",
    },
    ...Array.from(
      { length: n },
      (_, i): TimelineElement<RadarCompareElementId> => ({
        id: `vertex:${i}`,
        lane: "Vertices",
        label: list[i] ?? `Vertex ${i + 1}`,
        start: 58 + i * stagger,
        length: 30,
        follows: i > 0 ? `vertex:${i - 1}` : "brand",
      }),
    ),
    {
      id: "settle",
      lane: "Competitor",
      label: "Settle",
      start: 80,
      length: 20,
      follows: `vertex:${n - 1}`,
    },
    {
      id: "slide",
      lane: "Camera",
      label: "Slide left",
      start: 86,
      length: 32,
      follows: "settle",
    },
    {
      id: "name",
      lane: "Copy",
      label: "Brand name",
      start: 98,
      length: 22,
      follows: "slide",
    },
    {
      id: "caption",
      lane: "Copy",
      label: "Caption",
      start: 106,
      length: 20,
      follows: "name",
    },
    {
      id: "legend",
      lane: "Copy",
      label: "Legend",
      start: 112,
      length: 20,
      follows: "caption",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
