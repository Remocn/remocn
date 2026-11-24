import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The chart frame drawing in (sides, grid, top), the category labels, the
// target line and its label, the other bars rising, then the highlighted
// bar climbing, straining against the frame's top, breaking through, and
// the figure landing with its caption. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type OffTheChartsElementId =
  | "frame"
  | "grid"
  | "categories"
  | "top"
  | "target"
  | "bars"
  | "right"
  | "target-label"
  | "press"
  | "strain"
  | "break"
  | "hero"
  | "caption";

export interface OffTheChartsTimingProps {
  data?: object[];
  push?: number;
}

export const DEFAULT_CHART_DATA = [
  { label: "Q1", value: 58 },
  { label: "Q2", value: 74 },
  { label: "Q3", value: 86 },
  { label: "Q4", value: 260 },
];

const RISE = 40;
const PRESS = 66;
const BREAK = 69;

// `categories` fades the labels in, one every `stagger` frames, each over
// `fade`; `bars` raises the other bars the same way (`stagger`, `rise`).
// `press` climbs the highlighted bar to the frame's top over its length,
// its counter fading in from `countFrom` to `count`. `strain` bends the
// frame; `break` springs the bar through from its start. `hero` fades the
// figure in over its length, the counter fading out from `counterFrom` to
// `counterTo` around its start. Strain, break, hero and caption each follow
// the one before; strain follows the press.
export const offTheChartsTimeline = defineTimeline<
  OffTheChartsElementId,
  OffTheChartsTimingProps
>(({ data = DEFAULT_CHART_DATA, push = PRESS - RISE }) => {
  const n = data.length > 0 ? data.length : DEFAULT_CHART_DATA.length;
  const others = Math.max(0, n - 1);
  const pressAt = RISE + push;
  const breakAt = pressAt + (BREAK - PRESS);
  const hitAt = breakAt + 14;
  const elements: TimelineElement<OffTheChartsElementId>[] = [
    { id: "frame", lane: "Chart", label: "Frame", start: 0, length: 14 },
    { id: "grid", lane: "Chart", label: "Grid", start: 6, length: 14 },
    {
      id: "categories",
      lane: "Labels",
      label: "Categories",
      start: 6,
      length: (n - 1) * 2 + 12,
      beats: { stagger: 2, fade: 12 },
    },
    { id: "top", lane: "Chart", label: "Top edge", start: 8, length: 14 },
    { id: "target", lane: "Target", label: "Target", start: 10, length: 20 },
    {
      id: "bars",
      lane: "Bars",
      label: "Bars",
      start: 18,
      length: Math.max(0, others - 1) * 4 + 22,
      beats: { stagger: 4, rise: 22 },
    },
    { id: "right", lane: "Chart", label: "Right edge", start: 18, length: 12 },
    {
      id: "target-label",
      lane: "Target",
      label: "Target label",
      start: 24,
      length: 12,
    },
    {
      id: "press",
      lane: "Highlight",
      label: "Press",
      start: RISE,
      length: push,
      beats: { countFrom: 4, count: 10 },
    },
    {
      id: "strain",
      lane: "Highlight",
      label: "Strain",
      start: pressAt,
      length: BREAK - PRESS,
      follows: "press",
    },
    {
      id: "break",
      lane: "Highlight",
      label: "Break through",
      start: breakAt,
      length: hitAt - breakAt,
      follows: "strain",
    },
    {
      id: "hero",
      lane: "Figure",
      label: "Figure",
      start: hitAt,
      length: 7,
      follows: "break",
      beats: { counterFrom: -4, counterTo: 2 },
    },
    {
      id: "caption",
      lane: "Figure",
      label: "Caption",
      start: hitAt + 8,
      length: 16,
      follows: "hero",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
