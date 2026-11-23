import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The header, the rows building one after another, then the highlight block
// wiping in and travelling down to its row, where the arrow lands and the
// rest of the list dims. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type IndexListElementId =
  | "title"
  | "count"
  | `rule:${number}`
  | `row:${number}`
  | "block"
  | "travel"
  | "arrow"
  | "dim";

export interface IndexListTimingProps {
  items?: string[];
  highlight?: number;
  /** Frames between rows as the list builds. */
  stagger?: number;
}

export const DEFAULT_ITEMS = [
  "Transitions",
  "Captions",
  "Backgrounds",
  "Kinetic type",
  "Templates",
];
export const HIGHLIGHT = 3;
export const STAGGER = 3;
const HEAD = 18;
const COUNT_AT = 4;
const RULE_START = 2;
/** A rule draws over `RULE`. */
const RULE = 22;
/** A row's number rises over `RISE`, this long after its rule starts... */
const NUMBER_AT = 8;
const RISE = 18;
/** ...and its name this much after the number. */
const NAME_AFTER = 2;
const BLOCK_IN = 40;
const WIPE = 14;
/** The block's leading edge sets off this long after the wipe starts. */
const TRAVEL_AT = 12;
/** The trailing edge follows the leading one this much later. */
const TRAIL = 5;
/** The push on the whole list eases out until this long after parking. */
const PUSH_HOLD = 40;

/** The row the block parks on. */
export function highlightRow(items: string[], highlight: number) {
  const n = Math.max(1, items.length);
  return Math.min(Math.max(0, Math.round(highlight)), n - 1);
}

// A row's element is its number rising; the name rises `name` frames later
// over the same length. `travel` runs from the leading edge setting off to
// the trailing edge parking; `lead` is the leading edge's run.
export const indexListTimeline = defineTimeline<
  IndexListElementId,
  IndexListTimingProps
>(({ items = DEFAULT_ITEMS, highlight = HIGHLIGHT, stagger = STAGGER }) => {
  const hl = highlightRow(items, highlight);
  const travelDur = 14 + hl * 5;
  const travelStart = BLOCK_IN + TRAVEL_AT;
  const parkedAt = travelStart + TRAIL + travelDur;
  const elements: TimelineElement<IndexListElementId>[] = [
    { id: "title", lane: "Header", label: "title", start: 0, length: HEAD },
    {
      id: "count",
      lane: "Header",
      label: "count",
      start: COUNT_AT,
      length: HEAD,
    },
    // One rule above each row and one closing the list.
    ...Array.from(
      { length: Math.max(1, items.length) + 1 },
      (_, i): TimelineElement<IndexListElementId> => ({
        id: `rule:${i}`,
        lane: "Rules",
        label: `rule ${i + 1}`,
        start: RULE_START + i * stagger,
        length: RULE,
        follows: i > 0 ? `rule:${i - 1}` : undefined,
      }),
    ),
    ...items.map(
      (item, i): TimelineElement<IndexListElementId> => ({
        id: `row:${i}`,
        lane: "Rows",
        label: item,
        start: RULE_START + NUMBER_AT + i * stagger,
        length: RISE,
        follows: `rule:${i}`,
        beats: { name: NAME_AFTER },
      }),
    ),
    {
      id: "block",
      lane: "Highlight",
      label: items[hl] ?? "",
      start: BLOCK_IN,
      length: WIPE,
      follows: items.length > 0 ? `row:${items.length - 1}` : undefined,
    },
    {
      id: "travel",
      lane: "Highlight",
      label: "travel",
      start: travelStart,
      length: TRAIL + travelDur,
      follows: "block",
      beats: { lead: travelDur, trail: TRAIL, hold: PUSH_HOLD },
    },
    {
      id: "arrow",
      lane: "Arrow",
      label: "arrow",
      start: parkedAt - 4,
      length: 16,
      follows: "travel",
    },
    {
      id: "dim",
      lane: "Dim",
      label: "dim",
      start: parkedAt - 2,
      length: 20,
      follows: "travel",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
