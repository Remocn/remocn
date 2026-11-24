import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in word by word (the lead words, the slot, the words after
// it), then each gloss: fading in as ruby over the slot and pressing down into
// the line in place of the word there. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type RubyPressElementId =
  | `word:${number}`
  | "slot"
  | `tail:${number}`
  | `gloss:${number}`;

export interface RubyPressTimingProps {
  before?: string;
  words?: string[];
  after?: string;
  hold?: number;
  stagger?: number;
  press?: number;
}

export const DEFAULT_BEFORE = "Subtitles for every market in";
export const DEFAULT_WORDS = ["a fortnight", "a morning", "one render"];
export const DEFAULT_AFTER = ".";
export const RISE_GAP = 3;
export const PRESS = 22;
const HOLD = 14;

const RISE_AT = 0;
const RISE_LEN = 18;
const FIRST_GLOSS = 28;
const GLOSS_IN = 12;
const GLOSS_WAIT = 12;

/** The words in the slot, in order; at least one. */
export function slotsOf(words: string[]) {
  return words.length ? words : [""];
}

/** The tokens of a run of text. */
export function tokensOf(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

// `word:<i>` is lead word `i`, `slot` the slot in the hero line, `tail:<j>`
// word `j` after it; they rise one after another, a chain (the slot rises one
// step later than the next word would). `gloss:<i>` replaces slot word `i`
// with word `i + 1`: it fades in over `in`, and presses down from `pressAt`
// to its end. The glosses form a chain.
export const rubyPressTimeline = defineTimeline<
  RubyPressElementId,
  RubyPressTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    words = DEFAULT_WORDS,
    after = DEFAULT_AFTER,
    hold = HOLD,
    stagger = RISE_GAP,
    press = PRESS,
  }) => {
    const slots = slotsOf(words);
    const beforeTokens = tokensOf(before);
    const afterTokens = tokensOf(after);
    const nb = beforeTokens.length;
    const rise = (
      id: RubyPressElementId,
      label: string,
      o: number,
      follows: RubyPressElementId | undefined,
    ): TimelineElement<RubyPressElementId> => ({
      id,
      lane: "Line",
      label,
      start: RISE_AT + o * stagger,
      length: RISE_LEN,
      follows,
    });
    const elements: TimelineElement<RubyPressElementId>[] = [
      ...beforeTokens.map((s, i) =>
        rise(`word:${i}`, s, i, i > 0 ? `word:${i - 1}` : undefined),
      ),
      rise("slot", slots[0], nb + 1, nb > 0 ? `word:${nb - 1}` : undefined),
      ...afterTokens.map((s, j) =>
        rise(`tail:${j}`, s, nb + 2 + j, j > 0 ? `tail:${j - 1}` : "slot"),
      ),
    ];
    for (let i = 0; i < slots.length - 1; i++) {
      elements.push({
        id: `gloss:${i}`,
        lane: "Glosses",
        label: slots[i + 1],
        start: FIRST_GLOSS + i * (GLOSS_IN + GLOSS_WAIT + press + hold),
        length: GLOSS_IN + GLOSS_WAIT + press,
        follows: i > 0 ? `gloss:${i - 1}` : undefined,
        beats: { in: GLOSS_IN, pressAt: GLOSS_IN + GLOSS_WAIT },
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
