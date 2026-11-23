import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each feature rising at hero size in turn, then the row resolving out of
// the last one. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type FeatureTrioElementId =
  | "glow"
  | "ticks"
  | `item:${number}`
  | "resolve";

export interface FeatureTrioTimingProps {
  items?: { title: string; description?: string }[];
  /** Frames the finished row holds at the end. */
  hold?: number;
}

export const DEFAULT_ITEMS = [
  { title: "Fast.", description: "Drop in a scene and render it in minutes." },
  {
    title: "Composable.",
    description: "Every piece is a React component you can remix.",
  },
  {
    title: "Open source.",
    description: "MIT licensed. The code lands in your repo.",
  },
];
const HOLD = 36;
const START = 6;
const RESOLVE = 24;
const GLOW_IN = 24;
const TICKS_IN = 14;
/** The row starts resolving this long before the last item's slot ends. */
const RESOLVE_LEAD = 4;
/** Earlier titles come back `ROW_BACK` into the resolve, `ROW_STAGGER` apart. */
const ROW_BACK = 15;
const ROW_DESC = 20;
const ROW_STAGGER = 3;
const ROW_IN = 16;

/** The items the scene shows: up to four. */
export function shownItems<T>(items: T[]) {
  return items.slice(0, 4);
}

// Each item holds the stage for one slot; the slots shrink to fit the scene
// length so the row still gets its hold.
export const featureTrioTimeline = defineTimeline<
  FeatureTrioElementId,
  FeatureTrioTimingProps
>(({ items = DEFAULT_ITEMS, hold = HOLD }, { length }) => {
  const list = shownItems(items);
  const n = list.length;
  const slot = Math.max(
    22,
    Math.min(40, (length - START - RESOLVE - hold + 4) / Math.max(1, n)),
  );
  const at = (i: number) => START + i * slot;
  const r0 = at(n - 1) + slot - RESOLVE_LEAD;
  const elements: TimelineElement<FeatureTrioElementId>[] = [
    { id: "glow", lane: "Glow", label: "glow", start: 0, length: GLOW_IN },
    { id: "ticks", lane: "Ticks", label: "ticks", start: 0, length: TICKS_IN },
    ...list.map(
      (item, i): TimelineElement<FeatureTrioElementId> => ({
        id: `item:${i}`,
        lane: "Items",
        label: item.title,
        start: at(i),
        length: slot,
        follows: i > 0 ? `item:${i - 1}` : undefined,
      }),
    ),
    {
      id: "resolve",
      lane: "Row",
      label: "row",
      start: r0,
      length: RESOLVE,
      follows: n > 0 ? `item:${n - 1}` : undefined,
      beats: {
        back: ROW_BACK,
        desc: ROW_DESC,
        stagger: ROW_STAGGER,
        rowIn: ROW_IN,
      },
    },
  ];
  return elements;
});
