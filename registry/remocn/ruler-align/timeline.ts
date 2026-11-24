import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The messy line fading in letter by letter, the ruler sliding in tilted,
// levelling and rising to the baseline, the high letters dropping onto its
// edge, and two taps that kern the letters home. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type RulerAlignElementId =
  | `letter:${number}`
  | "ruler"
  | "level"
  | "rise"
  | `drop:${number}`
  | `tap:${number}`;

export interface RulerAlignTimingProps {
  text?: string;
  stagger?: number;
}

export const DEFAULT_TEXT = "Made to measure.";
export const IN_STAGGER = 2;
const IN = 0;
const FADE = 18;
const RULER_IN = 14;
const RULER_IN_LEN = 30;
const LEVEL = 44;
const LEVEL_LEN = 14;
const RISE = 56;
const RISE_LEN = 24;
const DROP = 82;
const DROP_STAGGER = 3;
const FALL = 10;
const TAPS = [112, 130];
const TAP_LEN = 10;
/** Letters start sliding this long into a tap, a frame apart in fours. */
const SLIDE_AT = 2;
const SLIDE_LEN = 16;

/** Letter `i` sits above the baseline in the messy line: it drops later. */
function isHigh(chars: string[], i: number) {
  return chars[i] !== " " && i % 2 === 0;
}

// `letter:<i>` is character `i` fading in (spaces have none); the letters
// form a chain. The ruler slides in, levels and rises (`ruler`, `level`,
// `rise`, a chain). `drop:<i>` is high letter `i` falling onto the edge;
// the drops follow the rise and each other. `tap:<k>` is a tap on the
// ruler: it dips over its length, and the letters slide from `slide` (plus
// a frame per letter, in fours) over `slideLen`. The taps follow the rise.
export const rulerAlignTimeline = defineTimeline<
  RulerAlignElementId,
  RulerAlignTimingProps
>(({ text = DEFAULT_TEXT, stagger = IN_STAGGER }) => {
  const chars = Array.from(text);
  const elements: TimelineElement<RulerAlignElementId>[] = [];
  let prevLetter: RulerAlignElementId | undefined;
  chars.forEach((ch, i) => {
    if (ch === " ") return;
    elements.push({
      id: `letter:${i}`,
      lane: "Letters",
      label: ch,
      start: IN + i * stagger,
      length: FADE,
      follows: prevLetter,
    });
    prevLetter = `letter:${i}`;
  });
  elements.push(
    {
      id: "ruler",
      lane: "Ruler",
      label: "slide in",
      start: RULER_IN,
      length: RULER_IN_LEN,
    },
    {
      id: "level",
      lane: "Ruler",
      label: "level",
      start: LEVEL,
      length: LEVEL_LEN,
      follows: "ruler",
    },
    {
      id: "rise",
      lane: "Ruler",
      label: "rise",
      start: RISE,
      length: RISE_LEN,
      follows: "level",
    },
  );
  let prevDrop: RulerAlignElementId = "rise";
  let k = 0;
  chars.forEach((ch, i) => {
    if (!isHigh(chars, i)) return;
    elements.push({
      id: `drop:${i}`,
      lane: "Drops",
      label: ch,
      start: DROP + k * DROP_STAGGER,
      length: FALL,
      follows: prevDrop,
    });
    prevDrop = `drop:${i}`;
    k++;
  });
  TAPS.forEach((at, n) => {
    elements.push({
      id: `tap:${n}`,
      lane: "Taps",
      label: `tap ${n + 1}`,
      start: at,
      length: TAP_LEN,
      follows: n > 0 ? `tap:${n - 1}` : "rise",
      beats: { slide: SLIDE_AT, slideLen: SLIDE_LEN },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
