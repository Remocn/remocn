import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The title and the bar coming in, the bar splitting into its segments, the
// label switching to "after", the segments collapsing to their new sizes as
// the freed time opens up, then the hero figure rolling in under its
// bracket. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type TimeBreakdownElementId =
  | "title"
  | "bar"
  | "drift"
  | "split"
  | `segment:${number}`
  | "switch"
  | "collapse"
  | "hero";

interface Segment {
  label: string;
  value: number;
}

export interface TimeBreakdownTimingProps {
  before?: Segment[];
  after?: Segment[];
  /** Frames between characters of the hero figure as it rolls in. */
  stagger?: number;
}

export const DEFAULT_BEFORE = [
  { label: "Editing", value: 62 },
  { label: "Rendering", value: 24 },
  { label: "Export", value: 14 },
];

export const DEFAULT_AFTER = [
  { label: "Editing", value: 6 },
  { label: "Rendering", value: 24 },
  { label: "Export", value: 14 },
];

const T_SPLIT = 22;
const T_SWITCH = 66;
const T_COLLAPSE = 74;
const COLLAPSE_LEN = 36;
const T_DONE = T_COLLAPSE + COLLAPSE_LEN;
const ROLL = 22;

/** The segments as they go from `before` to `after`, at most five. */
export function segmentsOf(before: Segment[], after: Segment[]) {
  return before.slice(0, 5).map((b, i) => ({
    label: b.label,
    from: Math.max(0, b.value),
    to: Math.max(0, after[i]?.value ?? b.value),
  }));
}

/** The share of the time saved, in whole percent. */
export function savedOf(segs: ReturnType<typeof segmentsOf>) {
  const totalBefore = segs.reduce((s, x) => s + x.from, 0) || 1;
  const totalAfter = segs.reduce((s, x) => s + x.to, 0);
  return Math.max(0, Math.round((1 - totalAfter / totalBefore) * 100));
}

// `title` and `bar` come in (from before the scene's first frame). `drift` is
// the slow camera push over the whole build. `split` opens the gaps between
// segments; `segment:<i>` (a chain after the split) brings in segment `i`'s
// label and counts its share up over `count`. `switch` swaps the heading to
// "after". `collapse` shrinks the
// segments to their new sizes: they tint from `tint` to `tintEnd`, the freed
// panel fades in from `freedAt` to `freedEnd`, and its aurora drifts until
// `auroraEnd`. `hero` (following the collapse) rolls the figure in, one
// character every `stagger` frames, each over `roll`; its bracket draws from
// `bracketAt` to `bracketEnd` and the caption from `capAt` to `capEnd`.
export const timeBreakdownTimeline = defineTimeline<
  TimeBreakdownElementId,
  TimeBreakdownTimingProps
>(({ before = DEFAULT_BEFORE, after = DEFAULT_AFTER, stagger = 3 }) => {
  const hero = `${savedOf(segmentsOf(before, after))}%`;
  const chars = Array.from(hero).length;
  const elements: TimelineElement<TimeBreakdownElementId>[] = [
    { id: "title", lane: "Copy", label: "Title", start: -6, length: 22 },
    { id: "bar", lane: "Bar", label: "Bar", start: -4, length: 28 },
    {
      id: "drift",
      lane: "Camera",
      label: "Drift",
      start: 0,
      length: T_DONE + 60,
    },
    { id: "split", lane: "Bar", label: "Split", start: T_SPLIT, length: 18 },
    ...segmentsOf(before, after).map(
      (seg, i): TimelineElement<TimeBreakdownElementId> => ({
        id: `segment:${i}`,
        lane: "Segments",
        label: seg.label,
        start: T_SPLIT + 6 + i * 4,
        length: 20,
        follows: i > 0 ? `segment:${i - 1}` : "split",
        beats: { count: 28 },
      }),
    ),
    {
      id: "switch",
      lane: "Copy",
      label: "After",
      start: T_SWITCH,
      length: 14,
    },
    {
      id: "collapse",
      lane: "Bar",
      label: "Collapse",
      start: T_COLLAPSE,
      length: COLLAPSE_LEN,
      beats: {
        tint: -4,
        tintEnd: 6,
        freedAt: 6,
        freedEnd: 22,
        auroraEnd: COLLAPSE_LEN + 80,
      },
    },
    {
      id: "hero",
      lane: "Copy",
      label: hero,
      start: T_DONE - 4,
      length: Math.max(32, (chars - 1) * stagger + ROLL),
      follows: "collapse",
      beats: {
        stagger,
        roll: ROLL,
        bracketAt: -6,
        bracketEnd: 18,
        capAt: 12,
        capEnd: 32,
      },
    },
  ];
  return elements;
});
