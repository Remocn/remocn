import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The label and each pricing line rising in, each line leaving in a
// shuffled order, then the price and the note landing in the space left.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type PricePageElementId =
  | "label"
  | `line:${number}`
  | `exit:${number}`
  | "price"
  | "note";

export interface PricePageTimingProps {
  lines?: string[];
  price?: string;
  note?: string;
  hold?: number;
}

export const DEFAULT_LINES = [
  "Starter, Pro, Team, Enterprise",
  "Per seat, per month",
  "Billed yearly, save 20%",
  "Watermark on the free plan",
  "Three exports a month",
  "Overage fees may apply",
  "Contact sales",
];

/** The lines that are drawn: blank ones are dropped. */
export function rowsOf(lines: string[]) {
  return lines.filter((s) => s.trim().length > 0);
}

const EXIT_LEN = 9;

// `line:<i>` rises line `i` in; `exit:<i>` pushes it off to the right, and
// its row closes up from `collapse` to `collapseEnd`. The exits leave in a
// shuffled order, spaced to fit the clip, and form a chain in that order.
// `price` follows the last exit and opens the room for itself and the note
// from `grow` to `growEnd`; `note` follows the price.
export const pricePageTimeline = defineTimeline<
  PricePageElementId,
  PricePageTimingProps
>(
  (
    {
      lines = DEFAULT_LINES,
      price = "Free.",
      note = "That’s the whole pricing page.",
      hold = 40,
    },
    { length },
  ) => {
    const T = length;
    const rows = rowsOf(lines);
    const n = rows.length;
    const intro = hold;
    const tail = 44;
    const land = 22;
    const gap =
      n > 1
        ? Math.max(4, Math.min(10, (T - intro - tail - land - 12) / (n - 1)))
        : 0;
    const ord = Array.from({ length: n }, (_, i) => i).sort(
      (a, b) => ((a * 3) % n) - ((b * 3) % n) || a - b,
    );
    const lastExit = n > 0 ? intro + (n - 1) * gap : intro;
    const landAt = lastExit + 8;
    const lastId: PricePageElementId | undefined =
      n > 0 ? `exit:${ord[n - 1]}` : undefined;
    const elements: TimelineElement<PricePageElementId>[] = [
      { id: "label", lane: "Label", label: "label", start: 0, length: 16 },
      ...rows.map(
        (s, i): TimelineElement<PricePageElementId> => ({
          id: `line:${i}`,
          lane: "Lines",
          label: s,
          start: 3 + i * 3,
          length: 16,
          follows: i > 0 ? `line:${i - 1}` : undefined,
        }),
      ),
      ...ord.map(
        (i, k): TimelineElement<PricePageElementId> => ({
          id: `exit:${i}`,
          lane: "Exits",
          label: rows[i],
          start: intro + k * gap,
          length: EXIT_LEN,
          follows: k > 0 ? `exit:${ord[k - 1]}` : undefined,
          beats: { collapse: 7, collapseEnd: 18 },
        }),
      ),
      {
        id: "price",
        lane: "Price",
        label: price,
        start: landAt,
        length: 20,
        follows: lastId,
        beats: { grow: -6, growEnd: 14 },
      },
      {
        id: "note",
        lane: "Price",
        label: note,
        start: landAt + 12,
        length: 18,
        follows: "price",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
