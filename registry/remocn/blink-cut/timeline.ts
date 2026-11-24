import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One word per hard cut, each on screen for its beats, then the closing
// lockup with the line rising under the wordmark. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type BlinkCutElementId = `cut:${number}` | "lockup";

export type BlinkLayout =
  | "giant"
  | "center"
  | "dot"
  | "corner"
  | "top-left"
  | "low-right"
  | "crop-right"
  | "crop-left"
  | "crop-bottom";

export type BlinkGround = "base" | "invert" | "accent";

export interface BlinkWord {
  text: string;
  /** Where and how big the word sits. Defaults cycle through a fixed rhythm. */
  layout?: BlinkLayout;
  /** Background for this cut. */
  ground?: BlinkGround;
  /** How many beats (of `framesPerWord`) this word stays on screen. */
  beats?: number;
}

export interface BlinkCutTimingProps {
  words?: Array<string | BlinkWord>;
  framesPerWord?: number;
  line?: string;
}

export const DEFAULT_WORDS: BlinkWord[] = [
  { text: "Cut", layout: "giant", ground: "base" },
  { text: "Fast", layout: "crop-right", ground: "base" },
  { text: "small", layout: "corner", ground: "base" },
  { text: "Loud", layout: "crop-bottom", ground: "invert" },
  { text: "Bold", layout: "top-left", ground: "base" },
  { text: "Sharp", layout: "center", ground: "accent" },
  { text: "Clean", layout: "low-right", ground: "base" },
  { text: "Snap", layout: "crop-left", ground: "invert" },
  { text: "Beat", layout: "giant", ground: "base" },
  { text: "quiet", layout: "dot", ground: "base" },
  { text: "Type", layout: "crop-bottom", ground: "accent" },
  { text: "Move", layout: "top-left", ground: "invert" },
  { text: "Hold", layout: "center", ground: "base" },
  { text: "Ship", layout: "giant", ground: "invert" },
  { text: "Now", layout: "crop-right", ground: "accent" },
];

const LAYOUT_CYCLE: BlinkLayout[] = [
  "giant",
  "crop-right",
  "corner",
  "crop-bottom",
  "top-left",
  "center",
  "low-right",
  "crop-left",
  "dot",
];
const GROUND_CYCLE: BlinkGround[] = [
  "base",
  "base",
  "invert",
  "base",
  "accent",
  "base",
  "invert",
];

const LINE_AT = 6;
const LINE_END = 18;
const RISE = 24;

/** The words as cuts: text, layout, ground and length in frames. */
export function blinkCutsOf(
  words: Array<string | BlinkWord>,
  framesPerWord: number,
) {
  const beat = Math.max(1, Math.round(framesPerWord));
  return words.map((w, i) => {
    const word = typeof w === "string" ? { text: w } : w;
    return {
      text: word.text,
      layout: word.layout ?? LAYOUT_CYCLE[i % LAYOUT_CYCLE.length],
      ground: word.ground ?? GROUND_CYCLE[i % GROUND_CYCLE.length],
      length: beat * Math.max(1, Math.round(word.beats ?? 1)),
    };
  });
}

// Each cut holds until the next one; the cuts are a chain. The lockup comes
// after the last cut and holds to the end: its line rises from `line` to
// `lineEnd`, the glow under it over `rise`.
export const blinkCutTimeline = defineTimeline<
  BlinkCutElementId,
  BlinkCutTimingProps
>(({ words = DEFAULT_WORDS, framesPerWord = 6 }, { length }) => {
  const cuts = blinkCutsOf(words, framesPerWord);
  const elements: TimelineElement<BlinkCutElementId>[] = [];
  let start = 0;
  cuts.forEach((cut, i) => {
    elements.push({
      id: `cut:${i}`,
      lane: "Cuts",
      label: cut.text,
      start,
      length: cut.length,
      follows: i > 0 ? `cut:${i - 1}` : undefined,
    });
    start += cut.length;
  });
  elements.push({
    id: "lockup",
    lane: "Lockup",
    label: "Lockup",
    start,
    length: Math.max(RISE, length - start),
    follows: cuts.length > 0 ? `cut:${cuts.length - 1}` : undefined,
    beats: { line: LINE_AT, lineEnd: LINE_END, rise: RISE },
  });
  return elements;
});
