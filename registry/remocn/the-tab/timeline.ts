import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The receipt's rows landing one by one (item, dotted leader, price), the
// rule drawing under them, the total label and the total's words. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type TheTabElementId =
  | `row:${number}`
  | "rule"
  | "total"
  | `value:${number}`;

export interface TabRow {
  item: string;
  price?: string;
}

export interface TheTabTimingProps {
  items?: TabRow[];
  total?: string;
  /** Frames between words of the total as it lands. */
  stagger?: number;
}

export const DEFAULT_ITEMS: TabRow[] = [
  { item: "Every component" },
  { item: "Every template" },
  { item: "Every future update" },
  { item: "Seats for the whole team" },
  { item: "Renders on your own machine" },
];
export const DEFAULT_TOTAL = "one Sunday morning.";
export const DEFAULT_STAGGER = 5;

/** The rows that have an item. */
export function rowsOf(items: TabRow[]) {
  return items.filter((r) => r.item.trim().length > 0);
}

/** The total split into the words that land one by one. */
export function totalWordsOf(total: string) {
  return total.split(/\s+/).filter(Boolean);
}

// `row:<i>` is row `i` landing: the item rises over `item`, the leader runs
// from `leadIn` to `leadOut`, the price drops in from `priceIn` to the end.
// The rows chain, spread over the scene length. `rule` follows the last row,
// `total` (the label) follows the rule, and `value:<k>`, word `k` of the
// total, chain after the label.
export const theTabTimeline = defineTimeline<
  TheTabElementId,
  TheTabTimingProps
>(
  (
    { items = DEFAULT_ITEMS, total = DEFAULT_TOTAL, stagger = DEFAULT_STAGGER },
    { length: T },
  ) => {
    const rows = rowsOf(items);
    const n = rows.length;
    const first = 6;
    const tail = 56;
    const step =
      n > 0
        ? Math.max(6, Math.min(14, (T - first - tail - 34) / Math.max(1, n)))
        : 0;
    const rowAt = (i: number) => first + i * step;
    const ruleAt = rowAt(Math.max(0, n - 1)) + 18;
    const totalAt = ruleAt + 10;
    const out: TimelineElement<TheTabElementId>[] = rows.map((r, i) => ({
      id: `row:${i}`,
      lane: "Rows",
      label: r.item,
      start: rowAt(i),
      length: 25,
      follows: i > 0 ? `row:${i - 1}` : undefined,
      beats: { item: 14, leadIn: 4, leadOut: 16, priceIn: 13 },
    }));
    out.push(
      {
        id: "rule",
        lane: "Total",
        label: "rule",
        start: ruleAt,
        length: 14,
        follows: n > 0 ? `row:${n - 1}` : undefined,
      },
      {
        id: "total",
        lane: "Total",
        label: "label",
        start: totalAt,
        length: 14,
        follows: "rule",
      },
    );
    totalWordsOf(total).forEach((word, k) => {
      out.push({
        id: `value:${k}`,
        lane: "Value",
        label: word,
        start: totalAt + 8 + k * stagger,
        length: 14,
        follows: k > 0 ? `value:${k - 1}` : "total",
      });
    });
    return out;
  },
);
