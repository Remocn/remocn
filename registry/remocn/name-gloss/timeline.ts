import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The name rising word by word, the words moving apart into columns (the
// ones not yet explained dimming), then part by part: the name word lights
// up and its gloss writes in word by word; last, the "why" line writes in
// and every name word lights up. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The glosses space out to fit the clip. The ids are
// public: a saved `timing` prop refers to them.

export type NameGlossElementId =
  | `name:${number}`
  | "move"
  | `part:${number}`
  | `gloss:${number}:${number}`
  | "why"
  | `why:${number}`;

export interface NameGlossPart {
  word: string;
  gloss: string;
}

export interface NameGlossTimingProps {
  parts?: NameGlossPart[];
  why?: string;
  /** Frames between words as a gloss writes in. */
  stagger?: number;
  /** Frames held on the finished card; the glosses space out to fit the rest. */
  hold?: number;
}

export const DEFAULT_PARTS: NameGlossPart[] = [
  { word: "Brand", gloss: "Your colours, your type, your logo." },
  { word: "kit", gloss: "Packed into every scene you install." },
];
export const DEFAULT_WHY =
  "So the film looks like yours from the first render.";

const NAME_STAGGER = 3;
const NAME_IN = 18;
const NAME_HOLD = 14;
const MOVE = 24;
/** The words not yet explained dim from `DIM_AT` into the move, over `DIM_IN`. */
const DIM_AT = MOVE - 8;
const DIM_IN = 10;
/** The glosses start this long before the move lands. */
const GLOSS_LEAD = 6;
export const WORD_STAGGER = 2;
const WORD_IN = 13;
/** A name word lights `LIGHT_LEAD` before its gloss starts, over `LIGHT_IN`. */
const LIGHT_LEAD = 4;
const LIGHT_IN = 10;
const WHY_AFTER = 28;
/** Frames the "why" line takes to write in, as the spacing counts it. */
const WHY = 24;
/** Every name word lights `DONE_LEAD` before the "why" line, over `DONE_IN`. */
const DONE_LEAD = 6;
const DONE_IN = 14;
export const HOLD = 42;
const MIN_GAP = 18;
const MAX_GAP = 44;

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

/** The parts shown: the given ones, or the defaults when empty. */
export function partsOf(parts: NameGlossPart[]) {
  return parts.length > 0 ? parts : DEFAULT_PARTS;
}

// `name:<i>` rises name word `i`, each following the one before. `move`
// carries the words into their columns; its `dim` and `dimIn` beats dim the
// words still waiting. `part:<i>` is part `i`'s turn: its name word lights
// from its `light` beat (before the start) over `lightIn`, and its gloss
// words `gloss:<i>:<k>` write in, a chain. Parts follow one another, the
// first following the move. `why` lights every name word from its `light`
// beat and its words `why:<k>` write in, following the last part.
export const nameGlossTimeline = defineTimeline<
  NameGlossElementId,
  NameGlossTimingProps
>(
  (
    {
      parts = DEFAULT_PARTS,
      why = DEFAULT_WHY,
      stagger = WORD_STAGGER,
      hold = HOLD,
    },
    { length },
  ) => {
    const list = partsOf(parts);
    const n = list.length;
    const span = length;
    const glossStart = NAME_IN + NAME_HOLD + MOVE - GLOSS_LEAD;
    const fixed = glossStart + WHY_AFTER + WHY + hold;
    const glossGap =
      n > 1
        ? Math.min(MAX_GAP, Math.max(MIN_GAP, (span - fixed) / (n - 1)))
        : 0;
    const glossAt = (i: number) => glossStart + i * glossGap;
    const whyAt = glossAt(n - 1) + WHY_AFTER;
    const moveAt = NAME_IN + NAME_HOLD;

    const elements: TimelineElement<NameGlossElementId>[] = list.map(
      (p, i): TimelineElement<NameGlossElementId> => ({
        id: `name:${i}`,
        lane: "Name",
        label: p.word,
        start: i * NAME_STAGGER,
        length: NAME_IN,
        follows: i > 0 ? `name:${i - 1}` : undefined,
      }),
    );
    elements.push({
      id: "move",
      lane: "Name",
      label: "move",
      start: moveAt,
      length: MOVE,
      follows: n > 0 ? `name:${n - 1}` : undefined,
      beats: { dim: DIM_AT, dimIn: DIM_IN },
    });
    list.forEach((p, i) => {
      const at = glossAt(i);
      elements.push({
        id: `part:${i}`,
        lane: "Parts",
        label: p.word,
        start: at,
        length: i < n - 1 ? glossGap : WHY_AFTER,
        follows: i > 0 ? `part:${i - 1}` : "move",
        beats: { light: -LIGHT_LEAD, lightIn: LIGHT_IN },
      });
      splitWords(p.gloss).forEach((w, k) => {
        elements.push({
          id: `gloss:${i}:${k}`,
          lane: "Glosses",
          label: w,
          start: at + k * stagger,
          length: WORD_IN,
          follows: k > 0 ? `gloss:${i}:${k - 1}` : `part:${i}`,
        });
      });
    });
    elements.push({
      id: "why",
      lane: "Parts",
      label: "why",
      start: whyAt,
      length: WHY,
      follows: n > 0 ? `part:${n - 1}` : "move",
      beats: { light: -DONE_LEAD, lightIn: DONE_IN },
    });
    splitWords(why).forEach((w, k) => {
      elements.push({
        id: `why:${k}`,
        lane: "Why",
        label: w,
        start: whyAt + k * stagger,
        length: WORD_IN,
        follows: k > 0 ? `why:${k - 1}` : "why",
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
