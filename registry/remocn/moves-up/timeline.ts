import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The roadmap: the three row labels rise, the first three items rise into
// Now, Next and Later, then one item at a time ships (its tag lands, it
// lifts out of Now) and the queue moves up a row. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. When the natural schedule runs
// past the clip, it is compressed to fit (`pace`). The ids are public: a
// saved `timing` prop refers to them.

export type MovesUpElementId =
  | `label:${number}`
  | `intro:${number}`
  | `ship:${number}`;

export interface MovesUpTimingProps {
  items?: string[];
  /** Frames the first three rows hold before the first item ships. */
  hold?: number;
  /** Frames between one item shipping and the next. */
  interval?: number;
}

export const DEFAULT_ITEMS = [
  "Auto captions",
  "Voiceover",
  "Vertical cuts",
  "Your type, your colours",
  "Whatever you ask for",
];

/** Where the natural schedule ends when nothing ships. */
const INTRO = 30;
const HOLD = 22;
const STEP = 66;
const LABEL_STAGGER = 4;
const LABEL_IN = 14;
const INTRO_AT = 6;
const INTRO_STAGGER = 5;
const INTRO_IN = 18;
/** The shipped tag lands over `TAG_IN`. */
const TAG_IN = 10;
/** The item lifts out of Now from `EXIT_AT` over `EXIT_DUR`. */
const EXIT_AT = 11;
const EXIT_DUR = 10;
/** The queue moves up a row from `PROMO_AT` over `PROMO_DUR`. */
const PROMO_AT = 14;
const PROMO_DUR = 20;

/** The items shown: the defaults when the list is empty. */
export function queueOf(items: string[]) {
  return items.length > 0 ? items : DEFAULT_ITEMS;
}

// `label:<r>` and `intro:<k>` rise over their length, each following the one
// before. `ship:<k>` ships item `k`: its tag, its exit and the queue moving
// up are beats from its start. Each ship follows the one before.
// `length` here is the clip length without `speed`, as the pace is counted.
export const movesUpTimeline = defineTimeline<
  MovesUpElementId,
  MovesUpTimingProps
>(({ items = DEFAULT_ITEMS, hold = HOLD, interval = STEP }, { length }) => {
  const queue = queueOf(items);
  const steps = Math.max(0, queue.length - 3);
  const stepAt = (s: number) => INTRO + hold + (s - 1) * interval;
  const naturalEnd = steps > 0 ? stepAt(steps) + PROMO_AT + PROMO_DUR : INTRO;
  const pace = Math.max(1, (naturalEnd + 30) / Math.max(1, length));
  const elements: TimelineElement<MovesUpElementId>[] = [0, 1, 2].map((r) => ({
    id: `label:${r}`,
    lane: "Labels",
    label: `row ${r + 1}`,
    start: (r * LABEL_STAGGER) / pace,
    length: LABEL_IN / pace,
    follows: r > 0 ? `label:${r - 1}` : undefined,
  }));
  queue.slice(0, 3).forEach((item, k) => {
    elements.push({
      id: `intro:${k}`,
      lane: "Items",
      label: item,
      start: (INTRO_AT + k * INTRO_STAGGER) / pace,
      length: INTRO_IN / pace,
      follows: k > 0 ? `intro:${k - 1}` : undefined,
    });
  });
  for (let s = 1; s <= steps; s++) {
    elements.push({
      id: `ship:${s - 1}`,
      lane: "Ships",
      label: queue[s - 1],
      start: stepAt(s) / pace,
      length: (PROMO_AT + PROMO_DUR) / pace,
      follows: s > 1 ? `ship:${s - 2}` : undefined,
      beats: {
        tag: TAG_IN / pace,
        exit: EXIT_AT / pace,
        exitLen: EXIT_DUR / pace,
        promo: PROMO_AT / pace,
        promoLen: PROMO_DUR / pace,
      },
    });
  }
  return elements.sort((a, b) => a.start - b.start);
});
