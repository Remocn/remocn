import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in word by word, each word bursting into cards letter by
// letter, then the logo landing and the caption under it. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type WordBurstCardsElementId =
  | "line"
  | `word:${number}`
  | "logo"
  | "caption";

export interface WordBurstCardsTimingProps {
  line?: string;
  burstAt?: number;
  stagger?: number;
}

export const DEFAULT_LINE = "Every screen you built, in motion";

const LINE_IN = -6;
/** Frames between one word rising in and the next. */
const LINE_STAGGER = 2;
const LINE_RISE = 12;
const BURST = 30;
const WORD_GAP = 4;
const LETTER_GAP = 0.5;
const LOGO = 60;
const CAPTION = 66;
const CAPTION_RISE = 12;

/** The words of the line, as the component counts them. */
export function wordsOf(line: string) {
  return line.split(" ").filter((w) => w.length > 0);
}

// `line` is the whole line rising in, one word every `stagger` beat, each
// over `rise`. `word:<i>` is word `i` bursting into cards, a letter every
// `letter` beat; the words are a chain. The logo lands a fixed time after
// the burst begins, and the caption follows it.
export const wordBurstCardsTimeline = defineTimeline<
  WordBurstCardsElementId,
  WordBurstCardsTimingProps
>(({ line = DEFAULT_LINE, burstAt = BURST, stagger = WORD_GAP }) => {
  const words = wordsOf(line);
  const elements: TimelineElement<WordBurstCardsElementId>[] = [
    {
      id: "line",
      lane: "Line",
      label: "Line rises in",
      start: LINE_IN,
      length: LINE_RISE + Math.max(0, words.length - 1) * LINE_STAGGER,
      beats: { stagger: LINE_STAGGER, rise: LINE_RISE },
    },
  ];
  words.forEach((word, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Burst",
      label: word,
      start: burstAt + i * stagger,
      length: stagger,
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats: { letter: LETTER_GAP },
    });
  });
  const logoAt = burstAt + (LOGO - BURST);
  elements.push(
    {
      id: "logo",
      lane: "Logo",
      label: "Logo lands",
      start: logoAt,
      length: CAPTION - LOGO,
    },
    {
      id: "caption",
      lane: "Logo",
      label: "Caption",
      start: burstAt + (CAPTION - BURST),
      length: CAPTION_RISE,
      follows: "logo",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
