import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A bubble of dots pops in and rises above the line, the line sets in word
// by word with its i's and j's dotless, then the dots hop out of the bubble
// one by one onto their stems and the full stop, and the subline rises.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type TittleDropElementId =
  | "bubble"
  | "rise"
  | `word:${number}`
  | `dot:${number}`
  | "subline";

export interface TittleDropTimingProps {
  title?: string;
  stagger?: number;
  hopGap?: number;
}

export const DEFAULT_TITLE = "Ship it in minutes.";
export const DOTLESS: Record<string, string> = { i: "ı", j: "ȷ" };
const BUBBLE_IN = 0;
const BUBBLE_LEN = 16;
const RISE = 30;
const RISE_LEN = 30;
const SET = 34;
const WORD_STAGGER = 5;
const SET_LEN = 24;
const HOP0 = 72;
const HOP_GAP = 12;
const HOP_LEN = 17;
const SHIFT_AT = 2;
const SHIFT_LEN = 9;
const PRE = -3;
const GIVE = 9;
const SUB_AFTER = 8;
const SUB_LEN = 30;

/** The word each character of the line belongs to; a space opens the next. */
export function wordIndices(chars: string[]) {
  const wordOf: number[] = [];
  chars.forEach((ch, i) => {
    wordOf.push((wordOf[i - 1] ?? 0) + (ch === " " ? 1 : 0));
  });
  return wordOf;
}

// `bubble` pops the bubble in; `rise` lifts it above the line. `word:<i>`
// sets word `i` in; the words form a chain. `dot:<k>` hops dot `k` from the
// bubble onto its glyph, landing at its end; it tenses `pre` frames before
// (a negative offset), the queue shuffles forward from `shift` over
// `shiftLen`, and the stem gives for `give` frames after it lands. The dots
// form a chain; `subline` follows the last one.
export const tittleDropTimeline = defineTimeline<
  TittleDropElementId,
  TittleDropTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    stagger = WORD_STAGGER,
    hopGap = HOP_GAP,
  }): TimelineElement<TittleDropElementId>[] => {
    const chars = Array.from(title);
    const hasStop = chars.at(-1) === ".";
    const wordOf = wordIndices(chars);
    const words: string[] = [];
    chars.forEach((ch, i) => {
      words[wordOf[i]] = (words[wordOf[i]] ?? "") + ch;
    });
    const dots = chars.filter(
      (ch, i) => DOTLESS[ch] || (hasStop && i === chars.length - 1),
    );
    const hopStart = (k: number) => HOP0 + k * hopGap;
    const n = dots.length;
    const lastLand = n > 0 ? hopStart(n - 1) + HOP_LEN : HOP0;

    const elements: TimelineElement<TittleDropElementId>[] = [
      {
        id: "bubble",
        lane: "Bubble",
        label: "bubble",
        start: BUBBLE_IN,
        length: BUBBLE_LEN,
      },
      {
        id: "rise",
        lane: "Bubble",
        label: "rise",
        start: RISE,
        length: RISE_LEN,
      },
    ];
    words.forEach((word, w) => {
      elements.push({
        id: `word:${w}`,
        lane: "Line",
        label: word.trim(),
        start: SET + w * stagger,
        length: SET_LEN,
        follows: w > 0 ? `word:${w - 1}` : undefined,
      });
    });
    dots.forEach((ch, k) => {
      elements.push({
        id: `dot:${k}`,
        lane: "Dots",
        label: ch === "." ? "full stop" : ch,
        start: hopStart(k),
        length: HOP_LEN,
        follows: k > 0 ? `dot:${k - 1}` : undefined,
        beats: { pre: PRE, shift: SHIFT_AT, shiftLen: SHIFT_LEN, give: GIVE },
      });
    });
    elements.push({
      id: "subline",
      lane: "Subline",
      label: "subline",
      start: lastLand + SUB_AFTER,
      length: SUB_LEN,
      follows: n > 0 ? `dot:${n - 1}` : "rise",
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
