import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line drawing in towards the interchange, the hub popping as the
// first one arrives, the hub growing once all have arrived, and the title
// rising in beside it. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type TransitLinesElementId =
  | "drift"
  | `line:${number}`
  | "hub"
  | "grow"
  | "title";

export type TransitPt = [number, number];
export type TransitSide = "n" | "s" | "e" | "w";
export type TransitTone = "accent" | "a" | "b" | "c";

export interface TransitLineShape {
  tone: TransitTone;
  points: TransitPt[];
  stations?: TransitPt[];
  labels?: { at: TransitPt; text: string; side: TransitSide }[];
}

export interface TransitLinesTimingProps {
  lines?: TransitLineShape[];
  stagger?: number;
  draw?: number;
}

export const DEFAULT_LINES: TransitLineShape[] = [
  {
    tone: "accent",
    points: [
      [-12, 3],
      [-8, 3],
      [-5, 0],
      [0, 0],
    ],
    stations: [
      [-10, 3],
      [-2.7, 0],
    ],
    labels: [{ at: [-12, 3], text: "Alder", side: "w" }],
  },
  {
    tone: "a",
    points: [
      [7, -6.5],
      [3.5, -6.5],
      [0, -3],
      [0, 0],
      [0, 6.3],
    ],
    stations: [
      [1.75, -4.75],
      [0, 3.4],
    ],
    labels: [
      { at: [7, -6.5], text: "Quay", side: "e" },
      { at: [0, 6.3], text: "Kiln", side: "e" },
    ],
  },
  {
    tone: "b",
    points: [
      [-10, -6],
      [-6, -6],
      [0, 0],
      [4, 4],
      [13.5, 4],
    ],
    stations: [
      [-8, -6],
      [-3.2, -3.2],
      [7.5, 4],
      [10.5, 4],
    ],
    labels: [
      { at: [-10, -6], text: "Fenwick", side: "w" },
      { at: [13.5, 4], text: "Larch", side: "e" },
    ],
  },
  {
    tone: "c",
    points: [
      [-11, 5.5],
      [-5.5, 5.5],
      [0, 0],
      [4, -4],
      [13.5, -4],
    ],
    stations: [
      [-8.2, 5.5],
      [-2.6, 2.6],
      [7.5, -4],
      [10.5, -4],
    ],
    labels: [
      { at: [-11, 5.5], text: "Holm", side: "w" },
      { at: [13.5, -4], text: "Vale", side: "e" },
    ],
  },
];

const DRAW_LEN = 38;
/** Frame the first line reaches the hub. */
const ARRIVE = 48;
const LINE_GAP = 4;

// `drift` slides the glow across the map. `line:<i>` draws line `i` in (both
// halves through the hub at once) so it reaches the hub at its end; each
// follows the one before. Its stations pop as the line passes them, and their
// labels fade in from `labelAt` after the station over `labelIn`. `hub` pops
// the hub as the first line arrives; `grow` grows it once all have arrived;
// `title` raises the title in, the kicker from `kickerAt` to `kickerEnd`.
export const transitLinesTimeline = defineTimeline<
  TransitLinesElementId,
  TransitLinesTimingProps
>(({ lines = DEFAULT_LINES, stagger = LINE_GAP, draw = DRAW_LEN }) => {
  const elements: TimelineElement<TransitLinesElementId>[] = [
    { id: "drift", lane: "Glow", label: "Drift", start: 0, length: 135 },
  ];
  lines.forEach((l, li) => {
    const arrive = ARRIVE + li * stagger;
    elements.push({
      id: `line:${li}`,
      lane: "Lines",
      label: l.labels?.[0]?.text ?? `Line ${li + 1}`,
      start: arrive - draw,
      length: draw,
      follows: li > 0 ? `line:${li - 1}` : undefined,
      beats: { labelAt: 4, labelIn: 14 },
    });
  });
  const lastArrive = ARRIVE + (lines.length - 1) * stagger;
  const GROW = lastArrive + 4;
  const TITLE = GROW + 8;
  elements.push(
    {
      id: "hub",
      lane: "Hub",
      label: "Hub",
      start: ARRIVE,
      length: Math.max(0, GROW - ARRIVE),
      follows: lines.length > 0 ? "line:0" : undefined,
    },
    {
      id: "grow",
      lane: "Hub",
      label: "Grow",
      start: GROW,
      length: TITLE - GROW,
      follows: lines.length > 0 ? `line:${lines.length - 1}` : "hub",
    },
    {
      id: "title",
      lane: "Title",
      label: "Title",
      start: TITLE,
      length: 20,
      follows: "grow",
      beats: { kickerAt: 6, kickerEnd: 24 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
