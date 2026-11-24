import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A round LED matrix counts down 3-2-1, a progress arc sweeps its rim, the
// ring's pixels hop into a pixel R, the matrix shrinks into the logo's R and
// the label types in beside it with a blinking caret. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type GlyphMatrixElementId =
  | `count:${number}`
  | "arc"
  | "hop"
  | "move"
  | `char:${number}`
  | "caret";

export interface GlyphMatrixTimingProps {
  label?: string;
  countStep?: number;
  typeStep?: number;
}

const NUM_STEP = 16;
const ROW_STEP = 0.45;
const ARC_START = 48;
const ARC_LEN = 26;
const HOP_START = 80;
const HOP_LEN = 13;
const MOVE_START = 104;
const MOVE_LEN = 22;
const TYPE_START = 128;
const TYPE_STEP = 2.5;

/** "remocn" (any case) types "emocn": the pixel R is its first letter. */
export function matrixCharsOf(label: string) {
  const logo = label.trim().toLowerCase() === "remocn";
  return Array.from(logo ? "emocn" : label);
}

// `count:<k>` shows numeral 3, 2, then 1 (a chain), its rows refreshing top
// to bottom `row` apart. `arc` sweeps the progress arc around the rim over
// its length while the 1 dims a level every `dim`. `hop` moves the ring's
// pixels into the R, each over `hop`; the arc gives way at `takeover`.
// `move` shrinks the matrix into the logo over its length. `char:<i>` types
// letter `i` of the label (a chain). `caret` holds the caret for `hold`
// after the last letter, then blinks it every `blink` until its end.
export const glyphMatrixTimeline = defineTimeline<
  GlyphMatrixElementId,
  GlyphMatrixTimingProps
>(({ label = "remocn", countStep = NUM_STEP, typeStep = TYPE_STEP }) => {
  // Everything after the countdown slides with its length.
  const shift = 3 * (countStep - NUM_STEP);
  const arcStart = ARC_START + shift;
  const hopStart = HOP_START + shift;
  const moveStart = MOVE_START + shift;
  const typeStart = TYPE_START + shift;
  const chars = matrixCharsOf(label);
  const elements: TimelineElement<GlyphMatrixElementId>[] = [];
  ["3", "2", "1"].forEach((numeral, k) => {
    elements.push({
      id: `count:${k}`,
      lane: "Countdown",
      label: numeral,
      start: countStep * k,
      length: k < 2 ? countStep : arcStart - countStep * 2,
      follows: k > 0 ? `count:${k - 1}` : undefined,
      beats: { row: ROW_STEP },
    });
  });
  elements.push(
    {
      id: "arc",
      lane: "Matrix",
      label: "Progress arc",
      start: arcStart,
      length: ARC_LEN,
      follows: "count:2",
      beats: { dim: 6 },
    },
    {
      id: "hop",
      lane: "Matrix",
      label: "Pixels hop into the R",
      start: hopStart,
      length: moveStart - hopStart,
      follows: "arc",
      beats: { hop: HOP_LEN, takeover: 1 },
    },
    {
      id: "move",
      lane: "Matrix",
      label: "Into the logo",
      start: moveStart,
      length: MOVE_LEN,
      follows: "hop",
    },
  );
  chars.forEach((ch, i) => {
    elements.push({
      id: `char:${i}`,
      lane: "Label",
      label: ch,
      start: typeStart + i * typeStep,
      length: typeStep,
      follows: i > 0 ? `char:${i - 1}` : "move",
    });
  });
  elements.push({
    id: "caret",
    lane: "Caret",
    label: "Caret",
    start: typeStart + chars.length * typeStep,
    length: 34,
    follows: chars.length > 0 ? `char:${chars.length - 1}` : "move",
    beats: { hold: 2, blink: 8 },
  });
  return elements;
});
