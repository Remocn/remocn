import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The panel springs up with its header, the rows build in, the cursor bar
// appears and hops between rows before landing on the pick, blinks to
// confirm, and the other rows dim. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type MenuPickElementId =
  | "panel"
  | "header"
  | `row:${number}`
  | "footer"
  | "cursor"
  | `hop:${number}`
  | "confirm"
  | "settle";

export interface MenuPickTimingProps {
  options?: string[];
  pick?: number;
  stagger?: number;
}

export const DEFAULT_OPTIONS = [
  "Keyframe every beat",
  "Wait on an agency",
  "Install the scenes",
];
export const DEFAULT_PICK = 2;
export const ROW_IN = 3;
const ROWS_AT = 4;
const CURSOR_AT = 14;
const HOP_GAPS = [10, 9, 7, 7];
const CONFIRM_GAP = 9;
const BLINK = 3;
const BLINKS = 2;

/** The rows shown: an empty list falls back to one. */
export function menuRows(options: string[]) {
  return options.length > 0 ? options : ["Start"];
}

/** The picked row, as a valid index. */
export function pickedRow(count: number, pick: number) {
  return Math.max(0, Math.min(count - 1, Math.round(pick)));
}

/** The rows the cursor visits: a feint to a neighbour, then the pick. */
export function hopRoute(count: number, pick: number) {
  if (count <= 1) return [0];
  const route = [0];
  const near = Math.max(0, Math.min(count - 1, pick === 0 ? 1 : pick - 1));
  const steps = [near, pick, near, pick];
  for (const s of steps) if (s !== route[route.length - 1]) route.push(s);
  if (route[route.length - 1] !== pick) route.push(pick);
  return route;
}

// Rows are a chain and the footer follows the last one. The cursor fades in
// over its length on the first row; `hop:<i>` springs it to the i-th row of
// its route and each hop follows the one before. The confirm presses the bar
// (its release `press` frames in) and blinks it off and on every `blink`
// frames; the settle dims the other rows.
export const menuPickTimeline = defineTimeline<
  MenuPickElementId,
  MenuPickTimingProps
>(({ options = DEFAULT_OPTIONS, pick = DEFAULT_PICK, stagger = ROW_IN }) => {
  const list = menuRows(options);
  const n = list.length;
  const route = hopRoute(n, pickedRow(n, pick));
  const hopAt = [CURSOR_AT];
  for (let i = 1; i < route.length; i++) {
    hopAt.push(hopAt[i - 1] + HOP_GAPS[Math.min(i - 1, HOP_GAPS.length - 1)]);
  }
  const confirmAt = (hopAt[hopAt.length - 1] as number) + CONFIRM_GAP;

  const elements: TimelineElement<MenuPickElementId>[] = [
    { id: "panel", lane: "Panel", label: "Panel", start: 0, length: 8 },
    { id: "header", lane: "Panel", label: "Header", start: 2, length: 12 },
  ];
  list.forEach((label, i) => {
    elements.push({
      id: `row:${i}`,
      lane: "Rows",
      label,
      start: ROWS_AT + i * stagger,
      length: 12,
      follows: i > 0 ? `row:${i - 1}` : undefined,
    });
  });
  elements.push(
    {
      id: "footer",
      lane: "Panel",
      label: "Footer",
      start: ROWS_AT + n * stagger,
      length: 12,
      follows: `row:${n - 1}`,
    },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: CURSOR_AT,
      length: 6,
    },
  );
  for (let i = 1; i < route.length; i++) {
    elements.push({
      id: `hop:${i}`,
      lane: "Cursor",
      label: `To ${list[route[i]]}`,
      start: hopAt[i],
      length: (i + 1 < route.length ? hopAt[i + 1] : confirmAt) - hopAt[i],
      follows: i > 1 ? `hop:${i - 1}` : "cursor",
    });
  }
  const blinks = BLINK * 2 * BLINKS;
  elements.push(
    {
      id: "confirm",
      lane: "Cursor",
      label: "Confirm",
      start: confirmAt,
      length: blinks,
      follows: route.length > 1 ? `hop:${route.length - 1}` : "cursor",
      beats: { press: 5, blink: BLINK },
    },
    {
      id: "settle",
      lane: "Rows",
      label: "Others dim",
      start: confirmAt + blinks,
      length: 10,
      follows: "confirm",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
