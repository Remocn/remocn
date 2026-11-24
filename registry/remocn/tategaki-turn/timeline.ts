import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word dropping letter by letter into its vertical column, then the turn:
// every line swinging from vertical to horizontal and travelling to its place
// in the settled line. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type TategakiTurnElementId = `word:${number}` | "turn";

export interface TategakiTurnTimingProps {
  text?: string;
  hold?: number;
  stagger?: number;
}

export const DEFAULT_TEXT = "Read it both ways.";
export const COL_STAGGER = 5;
const DEFAULT_HOLD = 16;

const LETTER_STAGGER = 2;
const LETTER_LEN = 11;
/** A word's first letter starts this many frames before its slot. */
const LETTER_LEAD = 3;
const SWING_LEN = 36;
const LINE_STAGGER = 12;
const TRAVEL_LEAD = 2;
const TRAVEL_LEN = 22;

/** The words of `text`; a blank text is one blank word. */
export function wordsOf(text: string) {
  const ws = text.split(/\s+/).filter(Boolean);
  return ws.length ? ws : [" "];
}

// `word:<j>` runs from its first letter starting to its last letter landing;
// the `letter` beat is the gap between letters, `rise` one letter's drop. The
// words form a chain. The turn follows the last word: line `l` starts
// swinging `l` × `line` frames after it, its `swing` spring lasts `swing`
// frames, and it travels from `travelLead` to `travel` frames after its own
// start. Which line a word sits on is measured, so the line offset is applied
// in the component.
export const tategakiTurnTimeline = defineTimeline<
  TategakiTurnElementId,
  TategakiTurnTimingProps
>(({ text = DEFAULT_TEXT, hold = DEFAULT_HOLD, stagger = COL_STAGGER }) => {
  const words = wordsOf(text);
  const n = words.length;
  const maxLen = Math.max(1, ...words.map((w) => Array.from(w).length));
  const lastStart = (n - 1) * stagger + (maxLen - 1) * LETTER_STAGGER;
  const turnAt = lastStart + LETTER_LEN + hold;
  const elements: TimelineElement<TategakiTurnElementId>[] = words.map(
    (word, j): TimelineElement<TategakiTurnElementId> => ({
      id: `word:${j}`,
      lane: "Words",
      label: word,
      start: j * stagger - LETTER_LEAD,
      length: (Array.from(word).length - 1) * LETTER_STAGGER + LETTER_LEN,
      follows: j > 0 ? `word:${j - 1}` : undefined,
      beats: { letter: LETTER_STAGGER, rise: LETTER_LEN },
    }),
  );
  elements.push({
    id: "turn",
    lane: "Turn",
    label: "turn",
    start: turnAt,
    length: SWING_LEN,
    follows: `word:${n - 1}`,
    beats: {
      line: LINE_STAGGER,
      swing: SWING_LEN,
      travelLead: -TRAVEL_LEAD,
      travel: TRAVEL_LEN,
    },
  });
  return elements;
});
