import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dots appearing scattered, the slow push, the dots flying into their
// rows column by column, each band's label as its row fills, then the
// other bands dimming, the figure landing and counting up, and the
// caption. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type DotSortElementId =
  | "scatter"
  | "push"
  | "sort"
  | `label:${number}`
  | "focus"
  | "figure"
  | "caption";

export interface DotSortTimingProps {
  groups?: { label: string; value: number }[];
  fly?: number;
}

export const DEFAULT_SORT_GROUPS = [
  { label: "remocn", value: 41 },
  { label: "Kitebase", value: 23 },
  { label: "Lumen", value: 17 },
  { label: "Fernway", value: 12 },
  { label: "Other", value: 7 },
];

const SORT_AT = 18;
const SWEEP = 24;
const JITTER = 9;
export const FLY = 28;

// `scatter` fades each dot in over `fade`, spread over `spread` frames.
// `sort` sends each dot off as the sweep reaches its column (`sweep`
// across all columns, plus up to `jitter`), flying over `fly`.
// `label:<i>` brings in the label of the i-th largest band; each follows
// the one before, the first follows the sort. The focus lands 2 frames
// after the last dot and follows the sort; the figure (landing over
// `land`) and the caption follow the focus.
export const dotSortTimeline = defineTimeline<
  DotSortElementId,
  DotSortTimingProps
>(({ groups = DEFAULT_SORT_GROUPS, fly = FLY }) => {
  const bands = groups
    .slice(0, 5)
    .map((g, i) => ({ ...g, i }))
    .sort((a, b) => b.value - a.value || a.i - b.i);
  const HIT = SORT_AT + SWEEP + JITTER + fly + 2;
  const elements: TimelineElement<DotSortElementId>[] = [
    {
      id: "scatter",
      lane: "Dots",
      label: "Scatter in",
      start: -6,
      length: 22,
      beats: { spread: 10, fade: 12 },
    },
    { id: "push", lane: "Camera", label: "Push", start: 0, length: HIT + 50 },
    {
      id: "sort",
      lane: "Dots",
      label: "Sort",
      start: SORT_AT,
      length: SWEEP + JITTER + fly,
      beats: { sweep: SWEEP, jitter: JITTER, fly },
    },
    ...bands.map(
      (b, bi): TimelineElement<DotSortElementId> => ({
        id: `label:${bi}`,
        lane: "Labels",
        label: b.label,
        start: SORT_AT + SWEEP * 0.4 + fly + bi * 3,
        length: 16,
        follows: bi > 0 ? `label:${bi - 1}` : "sort",
      }),
    ),
    {
      id: "focus",
      lane: "Dots",
      label: "Focus",
      start: HIT,
      length: 16,
      follows: "sort",
    },
    {
      id: "figure",
      lane: "Figure",
      label: "Figure",
      start: HIT + 2,
      length: 28,
      follows: "focus",
      beats: { land: 20 },
    },
    {
      id: "caption",
      lane: "Figure",
      label: "Caption",
      start: HIT + 12,
      length: 18,
      follows: "focus",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
