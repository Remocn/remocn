import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first headline springing into place, each flick up to the next one,
// and the rail fading in. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type FlickSwapElementId = `item:${number}` | "rail";

interface TimedItem {
  label?: string;
  headline: string;
  highlight?: string;
}

export interface FlickSwapTimingProps {
  items?: TimedItem[];
  dwell?: number;
}

export const DEFAULT_ITEMS: TimedItem[] = [
  {
    label: "Captions",
    headline: "Every word lands on the beat.",
    highlight: "on the beat",
  },
  {
    label: "Transitions",
    headline: "Cuts that feel expensive.",
    highlight: "expensive",
  },
  {
    label: "Backgrounds",
    headline: "Grounds that never sit still.",
    highlight: "never sit still",
  },
];

/** The items drawn: the list, or the defaults when it is empty. */
export const itemsOf = <T extends TimedItem>(items: T[]): (T | TimedItem)[] =>
  items.length > 0 ? items : DEFAULT_ITEMS;

export const DWELL = 28;
/** Frames the scroll takes to settle on a headline, before it dwells. */
const SETTLE = 22;
/** Frames the scroll is pulled back before it flicks. */
const DRAG = 7;
const RAIL_AT = 4;
const RAIL_LEN = 12;

// An item starts when the scroll lets go towards it and lasts until the
// next one does. Its `drag` beat (negative) is when the scroll starts being
// pulled back before the release. The items form a chain.
export const flickSwapTimeline = defineTimeline<
  FlickSwapElementId,
  FlickSwapTimingProps
>(({ items = DEFAULT_ITEMS, dwell = DWELL }) => {
  const period = SETTLE + dwell;
  const elements: TimelineElement<FlickSwapElementId>[] = itemsOf(items).map(
    (item, k): TimelineElement<FlickSwapElementId> => ({
      id: `item:${k}`,
      lane: "Items",
      label: item.label ?? item.headline,
      start: k * period,
      length: period,
      follows: k > 0 ? `item:${k - 1}` : undefined,
      beats: { drag: -DRAG },
    }),
  );
  elements.push({
    id: "rail",
    lane: "Rail",
    label: "rail",
    start: RAIL_AT,
    length: RAIL_LEN,
  });
  return elements.sort((a, b) => a.start - b.start);
});
