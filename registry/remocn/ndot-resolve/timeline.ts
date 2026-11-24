import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dot headline scanning in row by row, then each letter refreshing into
// solid type left to right (the emphasis word into its gradient dots), and
// one quiet refresh pass over the emphasis word in the hold. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type NdotResolveElementId = "scan" | `letter:${number}` | "pass";

export interface NdotResolveTimingProps {
  text?: string;
  emphasis?: string;
  resolveAt?: number;
  stagger?: number;
}

export const DEFAULT_TEXT = "Less noise. More launch.";
export const DEFAULT_EMPHASIS = "launch";
const RES_START = 34;
const STAGGER = 2.2;

/** Dot rows a headline line takes, descenders included. */
export const ROWS_PER_LINE = 9;
const ROW_STEP = 1.1;
const FLASH = 1;
const WIPE_LEN = 5;
const REFRESH_ROW = 0.6;
const REFRESH_DARK = 1;
const PASS_AFTER = 12;
const PASS_ROW = 0.9;
const PASS_DIM = 1.5;

/** The letters that resolve, in order: everything but spaces and breaks. */
const lettersOf = (text: string) =>
  text.split("").filter((ch) => ch !== " " && ch !== "\n");

// `scan` lights the dot rows top to bottom, a `row` apart, each half-lit
// for `flash`; a headline that wraps without "\n" counts as two lines.
// `letter:<i>` wipes letter i from dots to solid type over its length (the
// emphasis word refreshes its dot rows `refreshRow` apart, each dark for
// `dark`); the letters form a chain from `resolveAt`. `pass` runs over the
// emphasis word's rows `row` apart, each dim for `dim`, and follows the
// last letter.
export const ndotResolveTimeline = defineTimeline<
  NdotResolveElementId,
  NdotResolveTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    emphasis = DEFAULT_EMPHASIS,
    resolveAt = RES_START,
    stagger = STAGGER,
  }) => {
    const letters = lettersOf(text);
    const lines = text.includes("\n")
      ? text.split("\n").length
      : text.includes(" ")
        ? 2
        : 1;
    const elements: TimelineElement<NdotResolveElementId>[] = [
      {
        id: "scan",
        lane: "Scan",
        label: "scan in",
        start: 0,
        length: (lines * ROWS_PER_LINE - 1) * ROW_STEP + FLASH,
        beats: { row: ROW_STEP, flash: FLASH },
      },
    ];
    letters.forEach((ch, i) => {
      elements.push({
        id: `letter:${i}`,
        lane: "Letters",
        label: ch,
        start: resolveAt + i * stagger,
        length: WIPE_LEN,
        follows: i > 0 ? `letter:${i - 1}` : undefined,
        beats: { refreshRow: REFRESH_ROW, dark: REFRESH_DARK },
      });
    });
    if (emphasis.trim()) {
      const resEnd = resolveAt + (letters.length - 1) * stagger + WIPE_LEN;
      elements.push({
        id: "pass",
        lane: "Pass",
        label: emphasis.trim(),
        start: resEnd + PASS_AFTER,
        length: (ROWS_PER_LINE - 1) * PASS_ROW + PASS_DIM,
        follows:
          letters.length > 0 ? `letter:${letters.length - 1}` : undefined,
        beats: { row: PASS_ROW, dim: PASS_DIM },
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
