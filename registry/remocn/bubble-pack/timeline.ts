import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The bubble pack: the gray bubbles popping in from the middle out, the
// accent bubble growing and shoving them aside, then its number and label.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type BubblePackElementId = `pop:${number}` | "grow" | "hero";

export interface BubblePackTimingProps {
  items?: readonly { label: string; value: number }[];
  stagger?: number;
}

export const BUBBLE_ITEMS = [
  { label: "Launch videos", value: 420 },
  { label: "Demos", value: 180 },
  { label: "Changelogs", value: 150 },
  { label: "Social clips", value: 130 },
  { label: "Onboarding", value: 96 },
  { label: "Ads", value: 84 },
  { label: "Tutorials", value: 70 },
  { label: "Recaps", value: 58 },
  { label: "Teasers", value: 46 },
  { label: "Pitches", value: 38 },
];

export const BUBBLE_STAGGER = 3;
const GROW_IN = 4;
/** The accent bubble grows over these frames; the pack is simulated on them. */
export const ACC_START = 46;
export const ACC_END = 86;

// `pop:<k>` is the k-th gray bubble to pop in, counted from the middle of the
// pack out; the pops form a chain. A bubble fades in over the pop's length
// and its label rises from `labelAt` over `label`. `grow` swells the accent
// bubble and pushes the pack aside, fading it in from `fadeAt` over `fade`;
// the camera's slow drift settles at `settle`. `hero` brings the number in
// over its length, the label from `labelAt` over `label`, the count runs
// over `count` and the pair rises over `rise`.
export const bubblePackTimeline = defineTimeline<
  BubblePackElementId,
  BubblePackTimingProps
>(({ items = BUBBLE_ITEMS, stagger = BUBBLE_STAGGER }) => {
  const n = Math.min(items.length, 16);
  const grays = Math.max(0, n - 1);
  const elements: TimelineElement<BubblePackElementId>[] = [];
  for (let k = 0; k < grays; k++) {
    elements.push({
      id: `pop:${k}`,
      lane: "Bubbles",
      label: `bubble ${k + 1}`,
      start: GROW_IN + k * stagger,
      length: 6,
      follows: k > 0 ? `pop:${k - 1}` : undefined,
      beats: { labelAt: 8, label: 12 },
    });
  }
  elements.push(
    {
      id: "grow",
      lane: "Accent",
      label: "accent grows",
      start: ACC_START,
      length: ACC_END - ACC_START,
      beats: { fadeAt: -2, fade: 8, settle: ACC_END + 60 - ACC_START },
    },
    {
      id: "hero",
      lane: "Accent",
      label: "number",
      start: ACC_END - 8,
      length: 22,
      follows: "grow",
      beats: { labelAt: 6, label: 18, count: 30, rise: 24 },
    },
  );
  elements.sort((a, b) => a.start - b.start);
  return elements;
});
