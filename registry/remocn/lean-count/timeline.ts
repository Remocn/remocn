import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's glyphs rising into place, the rule drawing under it, the
// caption's words rising in, and the surges: each one steps the count and
// swings the figure's slant from one lean to the other. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LeanCountElementId =
  | "rise"
  | "rule"
  | `word:${number}`
  | `surge:${number}`;

export interface LeanCountTimingProps {
  label?: string;
  steps?: number;
  /** Frames between one surge and the next. */
  beat?: number;
}

export const DEFAULT_LABEL = "Faster renders on the laptop you already own.";
const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 3;
const FIRST_SURGE = 30;
export const SURGE_GAP = 16;
const COUNT_LEN = 13;
const LABEL_AT = 6;

/** The caption's words, as they rise in one by one. */
export function labelWordsOf(label: string) {
  return label ? label.split(" ") : [];
}

// `rise` is the figure's glyphs rising, each `stagger` after the one before,
// over `glyph`. `rule` is the rule drawing. `word:<i>` is word `i` of the
// caption rising; the words chain. `surge:<k>` is surge `k`: the count eases
// a step over its length and the slant springs from its start. The surges
// chain, `beat` apart.
export const leanCountTimeline = defineTimeline<
  LeanCountElementId,
  LeanCountTimingProps
>(({ label = DEFAULT_LABEL, steps = 3, beat = SURGE_GAP }) => {
  const n = Math.max(1, Math.round(steps));
  const out: TimelineElement<LeanCountElementId>[] = [
    {
      id: "rise",
      lane: "Figure",
      label: "rise",
      start: RISE_AT,
      length: RISE_LEN,
      beats: { glyph: RISE_LEN, stagger: RISE_GAP },
    },
    { id: "rule", lane: "Rule", label: "rule", start: 2, length: 28 },
  ];
  labelWordsOf(label).forEach((word, i) => {
    out.push({
      id: `word:${i}`,
      lane: "Caption",
      label: word,
      start: LABEL_AT + i * 3,
      length: 16,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    });
  });
  for (let k = 0; k < n; k++) {
    out.push({
      id: `surge:${k}`,
      lane: "Surges",
      label: `surge ${k + 1}`,
      start: FIRST_SURGE + k * beat,
      length: COUNT_LEN,
      follows: k > 0 ? `surge:${k - 1}` : undefined,
    });
  }
  return out.sort((a, b) => a.start - b.start);
});
