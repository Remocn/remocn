import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The quote rises word by word, the name rises under it, each detail joins
// the attribution as the block re-centres, and the highlighted words light
// up. Frames on the 30 fps scene timeline, after `delay` and `speed`; the
// details spread over the clip's length. The ids are public: a saved
// `timing` prop refers to them.

export type SaidWhoElementId =
  | `word:${number}`
  | "name"
  | `detail:${number}`
  | "highlight";

export interface SaidWhoTimingProps {
  quote?: string;
  highlight?: string;
  details?: string[];
  stagger?: number;
}

export const DEFAULT_QUOTE = "Took me one evening.";
export const DEFAULT_HIGHLIGHT = "one evening";
export const DEFAULT_DETAILS = [
  "backend engineer",
  "never edited a video before",
];
const STAGGER = 3;
const WORD_AT = 2;
const WORD_IN = 18;
const NAME_AT = 18;
const NAME_IN = 16;
const INTRO = 34;
const HOT_IN = 16;

export interface Tok {
  text: string;
  attach: boolean;
  hot?: boolean;
}

function stripQuotes(s: string) {
  return s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
}

export function quoteTokens(quote: string, highlight: string): Tok[] {
  const body = stripQuotes(quote);
  const at = highlight ? body.indexOf(highlight) : -1;
  const out: Tok[] = [];
  const words = body.split(" ").filter(Boolean);
  let cursor = 0;
  words.forEach((word, i) => {
    const s = body.indexOf(word, cursor);
    const e = s + word.length;
    cursor = e;
    const hot = at >= 0 && s < at + highlight.length && e > at;
    let text = word;
    if (i === 0) text = `“${text}`;
    if (i === words.length - 1) text = `${text}”`;
    out.push({ text, attach: false, hot });
  });
  return out;
}

export function wordTokens(s: string): Tok[] {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, attach: false }));
}

// `word:<i>` rises over its length; the words form a chain. `name` rises
// the dash and the name. `detail:<k>` adds detail `k` (from 1): the block
// glides to its new layout over the element, the comma fades in from
// `comma` over `commaIn`, the new words rise from `words`, `wordStep` apart,
// each over `wordIn`. The details follow the name and each other.
// `highlight` lights the highlighted words, late in the last detail's glide.
export const saidWhoTimeline = defineTimeline<
  SaidWhoElementId,
  SaidWhoTimingProps
>(
  (
    {
      quote = DEFAULT_QUOTE,
      highlight = DEFAULT_HIGHLIGHT,
      details = DEFAULT_DETAILS,
      stagger = STAGGER,
    },
    { length: T },
  ) => {
    const qToks = quoteTokens(quote, highlight);
    const shown = details.filter((d) => wordTokens(d).length > 0);
    const m = shown.length;
    const elements: TimelineElement<SaidWhoElementId>[] = qToks.map(
      (tk, i) => ({
        id: `word:${i}`,
        lane: "Quote",
        label: tk.text,
        start: WORD_AT + i * stagger,
        length: WORD_IN,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    elements.push({
      id: "name",
      lane: "Attribution",
      label: "name",
      start: NAME_AT,
      length: NAME_IN,
    });

    const intro = INTRO;
    const tail = Math.max(36, T * 0.25);
    const gapC = m > 0 ? Math.max(20, (T - tail - intro) / m) : 1;
    const TR = Math.min(20, gapC * 0.6);
    const startOf = (k: number) => intro + gapC * k - TR;
    for (let k = 1; k <= m; k++) {
      elements.push({
        id: `detail:${k}`,
        lane: "Attribution",
        label: shown[k - 1],
        start: startOf(k),
        length: TR,
        follows: k > 1 ? `detail:${k - 1}` : "name",
        beats: {
          comma: TR * 0.4,
          commaIn: 10,
          words: TR * 0.55,
          wordStep: 2,
          wordIn: 16,
        },
      });
    }
    elements.push({
      id: "highlight",
      lane: "Quote",
      label: highlight,
      start: m > 0 ? startOf(m) + TR * 0.7 : intro,
      length: HOT_IN,
      follows: m > 0 ? `detail:${m}` : "name",
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
