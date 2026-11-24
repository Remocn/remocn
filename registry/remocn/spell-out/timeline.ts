import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The name is spelled out letter by letter, each dropping in with a hyphen
// after it, holds, then closes up into the word, and the line rises under
// it. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type SpellOutElementId = `letter:${number}` | "close" | "line";

export interface SpellOutTimingProps {
  name?: string;
  line?: string;
  stagger?: number;
  hold?: number;
}

export const DEFAULT_NAME = "remocn";
export const DEFAULT_LINE = "Say it once. Remember it.";
const SPELL_AT = 4;
export const LETTER_GAP = 8;
const FALL = 7;
export const HOLD_SPELLED = 14;
const CLOSE_LEN = 20;
const LINE_DELAY = 14;
const LINE_RISE = 18;

/** The letters the name is spelled with, spaces dropped. */
export function lettersOf(name: string) {
  return Array.from(name.replace(/\s+/g, ""));
}

// A letter falls over `fall` and lands; its hyphen grows `dash` frames after
// the landing, over `dashLength`. The letters are a chain. The word closes
// `hold` frames after the last landing; each letter settles `settle` frames
// from the end of the close. The line rises at the end of the close.
export const spellOutTimeline = defineTimeline<
  SpellOutElementId,
  SpellOutTimingProps
>(
  ({
    name = DEFAULT_NAME,
    line = DEFAULT_LINE,
    stagger = LETTER_GAP,
    hold = HOLD_SPELLED,
  }) => {
    const chars = lettersOf(name);
    const n = chars.length;
    const elements: TimelineElement<SpellOutElementId>[] = chars.map(
      (ch, i) => ({
        id: `letter:${i}`,
        lane: "Letters",
        label: ch,
        start: SPELL_AT + i * stagger,
        length: FALL,
        follows: i > 0 ? `letter:${i - 1}` : undefined,
        beats: { fall: FALL, dash: 1, dashLength: 7 },
      }),
    );
    const lastLand = SPELL_AT + (n - 1) * stagger + FALL;
    const closeAt = lastLand + hold;
    elements.push({
      id: "close",
      lane: "Word",
      label: "Close up",
      start: closeAt,
      length: CLOSE_LEN,
      follows: n > 0 ? `letter:${n - 1}` : undefined,
      beats: { settle: -2 },
    });
    if (line) {
      elements.push({
        id: "line",
        lane: "Line",
        label: line,
        start: closeAt + CLOSE_LEN - 4 + LINE_DELAY - 10,
        length: LINE_RISE,
        follows: "close",
      });
    }
    return elements;
  },
);
