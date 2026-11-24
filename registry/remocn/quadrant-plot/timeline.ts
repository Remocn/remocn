import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The quadrant plot: the axes drawing in with their corner marks and end
// labels, the rival dots dropping in one by one, then the brand dot arriving
// along a curve and landing in its corner, which lights up while the camera
// drifts toward it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type QuadrantPlotElementId =
  | "axes"
  | "push"
  | "marks"
  | "labels"
  | `point:${number}`
  | "drift"
  | "arrive"
  | "sway"
  | "land";

/** A point as the schedule reads it (`QuadrantPoint`). */
export interface PlotPoint {
  label: string;
}

export interface QuadrantPlotTimingProps {
  points?: PlotPoint[];
  stagger?: number;
}

export const DEFAULT_PLOT_POINTS = [
  { label: "Kitebase", x: 0.71, y: 0.3 },
  { label: "Lumen", x: 0.27, y: 0.71 },
  { label: "Fernway", x: 0.2, y: 0.24 },
  { label: "Quarry", x: 0.6, y: 0.4 },
  { label: "Orbitly", x: 0.38, y: 0.58 },
  { label: "Halcyon", x: 0.13, y: 0.42 },
];

const AXIS = [-8, 22] as const;
const DROP = 26;
const DROP_STAGGER = 4;
const ARRIVE = 62;
const ARRIVE_LEN = 30;
const LANDED = ARRIVE + ARRIVE_LEN - 8;
const END = 140;

// `axes` draws the axes over its length and `marks` the corner marks.
// `labels` fades end label `k` in at `k` × `stagger` over `fade`. `point:<i>`
// drops rival `i` (fading over `fade`), its label sliding in from `labelAt`
// over `label`; the points form a chain. `arrive` carries the brand dot in
// along its curve, fading over `fade` and growing over `grow`. `land` follows
// it: the ring spreads over its length while the rivals dim (`dimAt` to
// `dim`), the brand corner washes in (`washAt` to `wash`), the guides draw
// (`guideAt` to `guide`) and the brand label comes up (`labelAt` to
// `label`). `push`, `drift` and `sway` are the camera push, the drift toward
// the brand and the background mesh swaying, all ending at frame 140.
export const quadrantPlotTimeline = defineTimeline<
  QuadrantPlotElementId,
  QuadrantPlotTimingProps
>(({ points = DEFAULT_PLOT_POINTS, stagger = DROP_STAGGER }) => {
  const elements: TimelineElement<QuadrantPlotElementId>[] = [
    {
      id: "axes",
      lane: "Axes",
      label: "axes",
      start: AXIS[0],
      length: AXIS[1] - AXIS[0],
    },
    { id: "push", lane: "Camera", label: "push", start: 0, length: END },
    { id: "marks", lane: "Axes", label: "corner marks", start: 12, length: 18 },
    {
      id: "labels",
      lane: "Labels",
      label: "end labels",
      start: 14,
      length: 3 * 2 + 18,
      beats: { stagger: 2, fade: 18 },
    },
  ];
  points.forEach((pt, i) => {
    elements.push({
      id: `point:${i}`,
      lane: "Points",
      label: pt.label,
      start: DROP + i * stagger,
      length: 19,
      follows: i > 0 ? `point:${i - 1}` : undefined,
      beats: { fade: 6, labelAt: 5, label: 14 },
    });
  });
  elements.push(
    {
      id: "drift",
      lane: "Camera",
      label: "drift",
      start: ARRIVE - 10,
      length: END - (ARRIVE - 10),
    },
    {
      id: "arrive",
      lane: "Brand",
      label: "arrive",
      start: ARRIVE,
      length: ARRIVE_LEN,
      beats: { fade: 5, grow: 10 },
    },
    {
      id: "sway",
      lane: "Background",
      label: "sway",
      start: LANDED - 4,
      length: END - (LANDED - 4),
      follows: "arrive",
    },
    {
      id: "land",
      lane: "Brand",
      label: "land",
      start: LANDED,
      length: 26,
      follows: "arrive",
      beats: {
        dimAt: -4,
        dim: 14,
        washAt: -2,
        wash: 20,
        guideAt: 4,
        guide: 22,
        labelAt: -2,
        label: 16,
      },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
