import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The screenshot rises in, then each callout pops its ring, draws its line
// and wipes its card in, folding the one before it away; the camera drifts
// in slowly over the whole tour. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type UiCalloutElementId = "enter" | "drift" | `callout:${number}`;

export type CalloutSide = "top" | "bottom" | "left" | "right";

export interface Callout {
  x: number;
  y: number;
  title: string;
  body?: string;
  side?: CalloutSide;
  delay?: number;
}

export interface UiCalloutTimingProps {
  callouts?: Callout[];
  stagger?: number;
}

export const DEFAULT_CALLOUTS: Callout[] = [
  {
    x: 358,
    y: 113,
    title: "Status at a glance",
    body: "Every issue carries its state, from Backlog to Done.",
    side: "bottom",
  },
  {
    x: 1333,
    y: 153,
    title: "Owners and due dates",
    body: "A name and a date on every row, so nothing slips.",
    side: "bottom",
  },
  {
    x: 40,
    y: 342,
    title: "Ship in cycles",
    body: "Unfinished work rolls into the next cycle on its own.",
    side: "bottom",
  },
];

const INTRO = 14;
const STAGGER = 30;
/** The card's text has settled this far into a callout. */
const TEXT_END = 31;

// A callout starts at its own `delay`, or `stagger` after the one before.
// It runs until the next callout starts (the last one until its text has
// settled): the ring pulses from `pulseAt`, the line draws from `lineAt`
// over `line`, the card wipes in at `wipeAt` and its text over
// `textAt`–`textEnd`. A callout folds the one before it away `foldAt` into
// itself. Staggered callouts follow the one before them.
export const uiCalloutTimeline = defineTimeline<
  UiCalloutElementId,
  UiCalloutTimingProps
>(({ callouts = DEFAULT_CALLOUTS, stagger = STAGGER }) => {
  const starts = callouts.map((c, i) => c.delay ?? INTRO + i * stagger);
  const order = callouts.map((_, i) => i).sort((a, b) => starts[a] - starts[b]);
  const lastStart = starts[starts.length - 1] ?? 0;
  const elements: TimelineElement<UiCalloutElementId>[] = [
    {
      id: "enter",
      lane: "Screen",
      label: "screenshot",
      start: -2,
      length: INTRO + 2,
    },
    {
      id: "drift",
      lane: "Camera",
      label: "drift",
      start: 0,
      length: lastStart + 70,
    },
  ];
  order.forEach((i, k) => {
    const next = order[k + 1];
    const staggered =
      i > 0 && callouts[i].delay === undefined && order.indexOf(i - 1) < k;
    elements.push({
      id: `callout:${i}`,
      lane: "Callouts",
      label: callouts[i].title,
      start: starts[i],
      length: next === undefined ? TEXT_END : starts[next] - starts[i],
      follows: staggered ? `callout:${i - 1}` : undefined,
      beats: {
        pulseAt: 8,
        lineAt: 6,
        line: 11,
        wipeAt: 15,
        textAt: 19,
        textEnd: TEXT_END,
        foldAt: 16,
      },
    });
  });
  return elements;
});
