import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word rising in letter by letter, the accent line cutting across it,
// the word splitting open onto the insert, and the slit settling to its
// band. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type SplitWordElementId = `letter:${number}` | "cut" | "open" | "settle";

export interface SplitWordTimingProps {
  word?: string;
  stagger?: number;
  hold?: number;
}

export const DEFAULT_WORD = "Now";
const STAGGER = 3;
const HOLD = 14;
const LETTER_LEAD = 6;
const LETTER_RISE = 18;
const CUT_AT = 20;
const CUT = 10;
const OPEN_AT = 30;
const OPEN = 24;
const SETTLE_AT = 54;
const SETTLE = 26;

/** The letters the word sets: A–Z, the rest are spaces. */
const lettersOf = (word: string) =>
  Array.from((word || "remocn").toUpperCase()).filter((ch) =>
    /^[A-Z]$/.test(ch),
  );

// `letter:<i>` rises letter i in, `stagger` after the one before; the
// letters form a chain, and the first is already rising on frame 0. `cut`
// draws the accent line, `open` splits the word, `settle` closes the slit
// to its band `hold` frames after it opened; each follows the one before.
export const splitWordTimeline = defineTimeline<
  SplitWordElementId,
  SplitWordTimingProps
>(({ word = DEFAULT_WORD, stagger = STAGGER, hold = HOLD }) => {
  const letters = lettersOf(word);
  const elements: TimelineElement<SplitWordElementId>[] = letters.map(
    (ch, i) => ({
      id: `letter:${i}`,
      lane: "Word",
      label: ch,
      start: i * stagger - LETTER_LEAD,
      length: LETTER_RISE,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
    }),
  );
  elements.push(
    {
      id: "cut",
      lane: "Slit",
      label: "cut",
      start: CUT_AT,
      length: CUT,
      follows: letters.length > 0 ? `letter:${letters.length - 1}` : undefined,
    },
    {
      id: "open",
      lane: "Slit",
      label: "open",
      start: OPEN_AT,
      length: OPEN,
      follows: "cut",
    },
    {
      id: "settle",
      lane: "Slit",
      label: "settle",
      start: SETTLE_AT + hold,
      length: SETTLE,
      follows: "open",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
