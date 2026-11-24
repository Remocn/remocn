import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The row of tiles popping in, the selection box, the highlight hopping
// between tiles while the glyphs roll, the press on the picked tile, the
// flood out of it, the logo landing with the corner dots flanking it, and
// the dots tucking away. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type FloodStingElementId =
  | "row"
  | "select"
  | "push"
  | `hop:${number}`
  | `roll:${number}`
  | "press"
  | "flood"
  | "logo"
  | "flank"
  | "tuck";

export type FloodStingGlyph =
  | "cluster"
  | "download"
  | "globe"
  | "gear"
  | "brackets"
  | "spark"
  | "grid"
  | "diamonds";

export interface FloodStingTimingProps {
  icons?: FloodStingGlyph[];
  rolls?: FloodStingGlyph[][];
  stagger?: number;
}

export const DEFAULT_ICONS: FloodStingGlyph[] = [
  "cluster",
  "download",
  "globe",
  "gear",
  "brackets",
];
export const DEFAULT_ROLLS: FloodStingGlyph[][] = [
  ["grid", "spark", "globe", "diamonds", "cluster"],
  ["diamonds", "grid", "spark", "cluster", "download"],
];

const ROW = -12;
const SELECT = 0;
const HOP_AT = [6, 18, 28, 36, 42];
const ROLL_AT = [22, 38];
const PRESS = 48;
const FLOOD = 54;
const LOGO = 62;
const FLANK = 62;
const TUCK = 96;
const END = 120;

// `row` pops tile `k` in at `k * stagger`. `select` springs the selection
// box in; corner `i` grows from `i * cornerStagger` over `cornerIn` and pops
// at `i * popStagger`. `push` is the slow camera push. `hop:<k>` moves the
// highlight to its next tile (a chain; the first brings it in, the last
// tints it to the flood color over `tint`). `roll:<k>` rolls every glyph on to
// the next set, tile by tile outwards from the pick (`ripple` frames apart,
// each over `turn`). `press` presses the picked tile, `flood` floods the frame
// from it (the picked tile leaving from `outAt` to `outEnd`), `logo` lands
// the logo, `flank` moves the corner dots beside it and `tuck` shrinks them
// away.
export const floodStingTimeline = defineTimeline<
  FloodStingElementId,
  FloodStingTimingProps
>(({ icons = DEFAULT_ICONS, rolls = DEFAULT_ROLLS, stagger = 2 }) => {
  const n = icons.length;
  const elements: TimelineElement<FloodStingElementId>[] = [
    {
      id: "row",
      lane: "Row",
      label: "Row",
      start: ROW,
      length: Math.max(0, n - 1) * stagger + 12,
      beats: { stagger },
    },
    {
      id: "select",
      lane: "Selection",
      label: "Select",
      start: SELECT,
      length: HOP_AT[0] - SELECT,
      beats: { cornerStagger: 1, cornerIn: 8, popStagger: 2 },
    },
    { id: "push", lane: "Camera", label: "Push", start: 0, length: END },
  ];
  HOP_AT.forEach((at, i) => {
    const next = HOP_AT[i + 1] ?? PRESS;
    elements.push({
      id: `hop:${i + 1}`,
      lane: "Highlight",
      label: `Hop ${i + 1}`,
      start: at,
      length: next - at,
      follows: i > 0 ? `hop:${i}` : "select",
      beats: i === HOP_AT.length - 1 ? { tint: 4 } : {},
    });
  });
  ROLL_AT.slice(0, rolls.length).forEach((at, i) => {
    elements.push({
      id: `roll:${i + 1}`,
      lane: "Glyphs",
      label: `Roll ${i + 1}`,
      start: at,
      length: 8,
      follows: i > 0 ? `roll:${i}` : "select",
      beats: { ripple: 1, turn: 8 },
    });
  });
  elements.push(
    {
      id: "press",
      lane: "Highlight",
      label: "Press",
      start: PRESS,
      length: FLOOD - PRESS,
      follows: `hop:${HOP_AT.length}`,
    },
    {
      id: "flood",
      lane: "Flood",
      label: "Flood",
      start: FLOOD,
      length: 15,
      follows: "press",
      beats: { outAt: 4, outEnd: 11 },
    },
    {
      id: "logo",
      lane: "Logo",
      label: "Logo",
      start: LOGO,
      length: 20,
      follows: "flood",
    },
    {
      id: "flank",
      lane: "Selection",
      label: "Flank the logo",
      start: FLANK,
      length: 20,
      follows: "flood",
    },
    {
      id: "tuck",
      lane: "Selection",
      label: "Tuck",
      start: TUCK,
      length: 8,
      follows: "flank",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
