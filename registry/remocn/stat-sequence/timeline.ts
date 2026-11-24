import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The stat sequence: the corner lockup, one monumental stat per cut, the last
// one holding as the hero, then the summary row assembling with the hero
// moving into its column. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type StatSequenceElementId = "intro" | `stat:${number}` | "summary";

export interface StatSequenceTimingProps {
  stats?: readonly { value: string }[];
  beat?: number;
  hold?: number;
  stagger?: number;
}

export const DEFAULT_STATS = [
  {
    value: "10,000",
    unit: "+",
    label: "builders",
    detail: "shipping videos every week",
  },
  {
    value: "99.9",
    unit: "%",
    label: "uptime",
    detail: "render API, last 12 months",
  },
  { value: "4.9", unit: "★", label: "rating", detail: "from 1,200 reviews" },
];
const START = 8;
const BEAT = 26;
const HOLD = 42;
const STAGGER = 1.6;
const MORPH = 24;

// `intro` fades the lockup in over `fade` while it rises over its length; the
// index ticker fades in from `indexAt` over `index`. `stat:<i>` cuts to stat
// i and runs until the next cut (the last one holds as the hero until the
// summary); the stats form a chain. Its digits roll in `stagger` apart and
// its caption rises from `captionAt`; the stat before it leaves from
// `cutAt`. The accent bar grows from `barAt` to `barTo` on the first stat
// and swipes out from `barOutAt`, back in from `barInAt` to `barTo` on every
// cut. `summary` moves the hero into the row over its length: the bar
// retires from `barAt` to `barTo`, the hero caption leaves at `captionOut`,
// the index fades over `index`, column `i`'s rule draws from `ruleAt + i *
// ruleGap` to `ruleTo + i * ruleGap`, its figure rolls in from `figAt + i *
// figGap` and its caption from `labelAt + i * figGap`; the camera drift
// settles at `drift`.
export const statSequenceTimeline = defineTimeline<
  StatSequenceElementId,
  StatSequenceTimingProps
>(({ stats = DEFAULT_STATS, beat = BEAT, hold = HOLD, stagger = STAGGER }) => {
  const n = Math.max(1, stats.length);
  const inAt = (i: number) => START + i * beat;
  const lastIn = inAt(n - 1);
  const M = lastIn + hold;
  const elements: TimelineElement<StatSequenceElementId>[] = [
    {
      id: "intro",
      lane: "Lockup",
      label: "lockup",
      start: 0,
      length: 16,
      beats: { fade: 12, indexAt: 2, index: 10 },
    },
  ];
  for (let i = 0; i < n; i++) {
    elements.push({
      id: `stat:${i}`,
      lane: "Stats",
      label: stats[i]?.value ?? `stat ${i + 1}`,
      start: inAt(i),
      length: i < n - 1 ? beat : hold,
      follows: i > 0 ? `stat:${i - 1}` : undefined,
      beats:
        i === 0
          ? { stagger, captionAt: 5, cutAt: -5, barAt: -2, barTo: 10 }
          : {
              stagger,
              captionAt: 5,
              cutAt: -5,
              barOutAt: -4,
              barInAt: 1,
              barTo: 10,
            },
    });
  }
  elements.push({
    id: "summary",
    lane: "Summary",
    label: "summary row",
    start: M,
    length: MORPH,
    follows: `stat:${n - 1}`,
    beats: {
      barAt: -2,
      barTo: 8,
      captionOut: -6,
      index: 10,
      ruleAt: 6,
      ruleTo: 24,
      ruleGap: 3,
      figAt: 8,
      figGap: 4,
      labelAt: 16,
      drift: MORPH + 40,
    },
  });
  return elements;
});
