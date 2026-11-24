import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The CRM table: it rises in with its rows, the pointer comes in, clicks
// Filter and picks a stage, the rows that don't match fade and collapse
// while the camera pushes in, the pointer sorts by ARR and the rows flip into
// order, then it ticks the first rows (the bulk-action bar comes up with the
// first tick) and hovers the action. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type TableFilterElementId =
  | "table"
  | "pointer"
  | "filter"
  | "option"
  | "collapse"
  | "camera"
  | "sort"
  | "flip"
  | `check:${number}`
  | "action";

export interface TableRecord {
  company: string;
  domain: string;
  stage: string;
  /** Annual recurring revenue in dollars, used for sorting. */
  arr: number;
  owner: string;
  lastInteraction: string;
  /** Logo tile color. */
  color: string;
}

export const DEFAULT_ROWS: TableRecord[] = [
  {
    company: "Kitebase",
    domain: "kitebase.io",
    stage: "Negotiation",
    arr: 1_400_000,
    owner: "Maya Chen",
    lastInteraction: "2 hours ago",
    color: "#3B82F6",
  },
  {
    company: "Lumen",
    domain: "lumen.app",
    stage: "Closed-won",
    arr: 320_000,
    owner: "Leo Park",
    lastInteraction: "Yesterday",
    color: "#F59E0B",
  },
  {
    company: "Fernway",
    domain: "fernway.com",
    stage: "Qualified",
    arr: 860_000,
    owner: "Priya Raman",
    lastInteraction: "3 days ago",
    color: "#10B981",
  },
  {
    company: "Quarry",
    domain: "quarry.dev",
    stage: "Closed-won",
    arr: 2_100_000,
    owner: "Maya Chen",
    lastInteraction: "4 hours ago",
    color: "#18181B",
  },
  {
    company: "Orbitly",
    domain: "orbitly.co",
    stage: "Lead",
    arr: 95_000,
    owner: "Sam Ortiz",
    lastInteraction: "1 week ago",
    color: "#8B5CF6",
  },
  {
    company: "Halcyon",
    domain: "halcyon.ai",
    stage: "Negotiation",
    arr: 1_100_000,
    owner: "Leo Park",
    lastInteraction: "Yesterday",
    color: "#0EA5E9",
  },
  {
    company: "Tessel",
    domain: "tessel.so",
    stage: "Closed-won",
    arr: 640_000,
    owner: "Priya Raman",
    lastInteraction: "2 days ago",
    color: "#EF4444",
  },
  {
    company: "Brightloom",
    domain: "brightloom.com",
    stage: "Closed-lost",
    arr: 210_000,
    owner: "Sam Ortiz",
    lastInteraction: "3 weeks ago",
    color: "#EC4899",
  },
  {
    company: "Cobalt Labs",
    domain: "cobaltlabs.com",
    stage: "Closed-won",
    arr: 1_200_000,
    owner: "Leo Park",
    lastInteraction: "6 hours ago",
    color: "#6366F1",
  },
];

export interface TableFilterTimingProps {
  rows?: TableRecord[];
  filterValue?: string;
  selectCount?: number;
}

const FILTER_CLICK = 48;
const OPTION_CLICK = 72;
const COLLAPSE = 78;
const SORT_CLICK = 114;
const FLIP = 117;
const CHECKS = [144, 151, 158];
const ACTION_HOVER = 180;
const FLIP_LEN = 11;
/** A click presses from `pressIn` and releases from `pressOut`, around it. */
const CLICK = { pressIn: -2, pressOut: 2 };

// `table` springs the window in: the read-in from `readAt` to `readEnd`,
// the rows from `rowsAt`, `row` apart. `pointer` fades the pointer in over
// its length and lands it at `rest`. On the pointer's lane each click is an
// element, pressing from `pressIn` to `pressOut`, with the pointer arriving
// at `arrive` and leaving at `leave`: `filter` opens the popover at `open`;
// `option` hovers the stage from `hover` to `hoverEnd`, closes the popover
// from `close` to `closeEnd` and pops the chip at `chip`; `sort` switches
// to ARR at `on`, widens the button until `arrowEnd` and glows it up to
// `glowIn`, holding to `glowHold`, out by `glowOut`; `check:<k>` ticks row
// `k` over `tick`, counting it at `on` (the first brings the bar up at
// `bar`); `action` hovers the bulk action from `hover` and clicks it at
// `click`. `collapse` fades the rows that don't match, `stagger` apart over
// `fade`, collapses them from `collapseAt` over `collapse` and swaps the
// count in over `count`. `camera` pushes in until the first tick. `flip`
// springs the sorted rows into order over its length.
export const tableFilterTimeline = defineTimeline<
  TableFilterElementId,
  TableFilterTimingProps
>(({ rows = DEFAULT_ROWS, filterValue = "Closed-won", selectCount = 3 }) => {
  const matches = rows.filter((r) => r.stage === filterValue).length;
  const nSel = Math.min(selectCount, matches);
  const check = CHECKS.slice(0, nSel);
  const elements: TimelineElement<TableFilterElementId>[] = [
    {
      id: "table",
      lane: "Table",
      label: "Table in",
      start: 0,
      length: 20,
      beats: { readAt: 6, readEnd: 20, rowsAt: 10, row: 2.5 },
    },
    {
      id: "pointer",
      lane: "Pointer",
      label: "Pointer in",
      start: 20,
      length: 8,
      beats: { rest: 2 },
    },
    {
      id: "filter",
      lane: "Pointer",
      label: "Click Filter",
      start: FILTER_CLICK,
      length: OPTION_CLICK - FILTER_CLICK,
      follows: "pointer",
      beats: { ...CLICK, arrive: -4, leave: 6, open: 1 },
    },
    {
      id: "option",
      lane: "Pointer",
      label: `Pick ${filterValue}`,
      start: OPTION_CLICK,
      length: SORT_CLICK - OPTION_CLICK,
      follows: "filter",
      beats: {
        ...CLICK,
        arrive: -4,
        leave: 6,
        hover: -8,
        hoverEnd: -3,
        close: 2,
        closeEnd: 6,
        chip: 4,
      },
    },
    {
      id: "collapse",
      lane: "Table",
      label: "Filter rows",
      start: COLLAPSE,
      length: 11,
      follows: "option",
      beats: { stagger: 0.6, fade: 4, collapseAt: 2, collapse: 9, count: 6 },
    },
    {
      id: "camera",
      lane: "Camera",
      label: "Push-in",
      start: COLLAPSE,
      length: (check[0] ?? COLLAPSE + 60) - COLLAPSE,
      follows: "collapse",
    },
    {
      id: "sort",
      lane: "Pointer",
      label: "Sort by ARR",
      start: SORT_CLICK,
      length: (check[0] ?? ACTION_HOVER) - SORT_CLICK,
      follows: "option",
      beats: {
        ...CLICK,
        arrive: -4,
        leave: 10,
        on: 1,
        arrowEnd: 7,
        glowIn: 4,
        glowHold: 26,
        glowOut: 36,
      },
    },
    {
      id: "flip",
      lane: "Table",
      label: "Reorder",
      start: FLIP,
      length: FLIP_LEN + 3,
      follows: "sort",
    },
  ];
  check.forEach((at, k) => {
    elements.push({
      id: `check:${k}`,
      lane: "Pointer",
      label: `Select row ${k + 1}`,
      start: at,
      length: (check[k + 1] ?? ACTION_HOVER) - at,
      follows: k > 0 ? `check:${k - 1}` : "sort",
      beats:
        k === 0
          ? { ...CLICK, arrive: -3, leave: 2, on: 1, tick: 6, bar: 2 }
          : { ...CLICK, arrive: -3, leave: 2, on: 1, tick: 6 },
    });
  });
  elements.push({
    id: "action",
    lane: "Pointer",
    label: "Hover the action",
    start: ACTION_HOVER,
    length: 10,
    follows: nSel > 0 ? `check:${nSel - 1}` : "sort",
    beats: { ...CLICK, hover: -5, click: 8 },
  });
  return elements;
});
