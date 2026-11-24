import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The title and the lockup rising in, the table's rules drawing one after
// another, each row's label rising and its value typing in, and the
// highlighted row opening up. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type SpecSheetElementId =
  | "title"
  | "lockup"
  | `rule:${number}`
  | `row:${number}`
  | "expand";

export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecSheetTimingProps {
  rows?: SpecRow[];
  stagger?: number;
  expandAt?: number;
}

export const DEFAULT_ROWS: SpecRow[] = [
  { label: "Resolution", value: "4K" },
  { label: "Frame rate", value: "60 fps" },
  { label: "Components", value: "236" },
  { label: "Install", value: "1 command" },
  { label: "License", value: "MIT" },
];

const STAGGER = 5;
const EXPAND = 62;

// `rule:<i>` is the rule above row `i` (the last one closes the table);
// `row:<i>` is row `i`: its label rises over the element, and its value
// counts and types in from the `value` beat for `type` frames. Rules and
// rows each form a chain. `expand` opens the highlighted row.
export const specSheetTimeline = defineTimeline<
  SpecSheetElementId,
  SpecSheetTimingProps
>(
  ({
    rows = DEFAULT_ROWS,
    stagger = STAGGER,
    expandAt = EXPAND,
  }): TimelineElement<SpecSheetElementId>[] => {
    const n = Math.max(1, rows.length);
    const elements: TimelineElement<SpecSheetElementId>[] = [
      { id: "title", lane: "Copy", label: "title", start: 0, length: 18 },
      { id: "lockup", lane: "Copy", label: "lockup", start: 8, length: 18 },
      ...Array.from(
        { length: n + 1 },
        (_, i): TimelineElement<SpecSheetElementId> => ({
          id: `rule:${i}`,
          lane: "Rules",
          label: `rule ${i + 1}`,
          start: 4 + i * stagger,
          length: 22,
          follows: i > 0 ? `rule:${i - 1}` : undefined,
        }),
      ),
      ...rows.map(
        (row, i): TimelineElement<SpecSheetElementId> => ({
          id: `row:${i}`,
          lane: "Rows",
          label: row.label,
          start: 10 + i * stagger,
          length: 18,
          follows: i > 0 ? `row:${i - 1}` : undefined,
          beats: { value: 2, type: 22 },
        }),
      ),
      {
        id: "expand",
        lane: "Highlight",
        label: "open row",
        start: expandAt,
        length: 22,
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
