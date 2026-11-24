import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The device rising in, the chapter rail and its list coming up beside it,
// and the five story slides taking over one another. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type YearInReviewElementId =
  | "device"
  | "rail"
  | `chapter:${number}`
  | `slide:${number}`;

export interface YearInReviewTimingProps {
  chapters?: string[];
}

export const DEFAULT_CHAPTERS = [
  "Your year",
  "Shipped",
  "Top component",
  "Your rank",
  "Share",
];
/** When each slide takes over: intro, shipped, top component, rank, share. */
const STARTS = [0, 78, 156, 252, 360];
/** Frames a slide takes to cover the one before it. */
const TR = 18;

// `slide:<k>` runs until the next slide; it covers the one before over
// `enter`, its chapter title rises over `act` and drops `actOut` after the
// next slide starts, and the rail's progress bar fills over `bar`. The
// slides are a chain. `chapter:<i>` slides chapter `i` into the list beside
// the device; the list is a chain. `device` is the spring that lifts the
// device in.
export const yearInReviewTimeline = defineTimeline<
  YearInReviewElementId,
  YearInReviewTimingProps
>(({ chapters = DEFAULT_CHAPTERS }) => {
  const elements: TimelineElement<YearInReviewElementId>[] = [
    {
      id: "device",
      lane: "Device",
      label: "device rises in",
      start: 0,
      length: 30,
    },
    {
      id: "rail",
      lane: "Rail",
      label: "rail",
      start: 6,
      length: 16,
    },
  ];
  chapters.forEach((chapter, i) => {
    elements.push({
      id: `chapter:${i}`,
      lane: "Chapters",
      label: chapter,
      start: 8 + i * 3,
      length: 14,
      follows: i > 0 ? `chapter:${i - 1}` : "rail",
    });
  });
  STARTS.forEach((start, k) => {
    elements.push({
      id: `slide:${k}`,
      lane: "Slides",
      label: chapters[k] ?? `slide ${k + 1}`,
      start,
      length: (STARTS[k + 1] ?? start + 110) - start,
      follows: k > 0 ? `slide:${k - 1}` : undefined,
      beats: {
        enter: TR,
        act: 12,
        actOut: 8,
        bar: (STARTS[k + 1] ?? start + 120) - start,
      },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
