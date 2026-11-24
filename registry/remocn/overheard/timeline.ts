import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each quote rising in word by word, its speaker's name after it, and each
// line dimming as the next one starts. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. When the speech runs past the clip it is
// compressed to fit (`k`). The ids are public: a saved `timing` prop refers
// to them.

export type OverheardElementId =
  | `word:${number}:${number}`
  | `name:${number}`
  | `dim:${number}`;

export interface OverheardLine {
  quote: string;
  name: string;
}

export interface OverheardTimingProps {
  lines?: OverheardLine[];
  /** Frames between words of a quote. */
  stagger?: number;
  /** Frames between one speaker's line and the next. */
  pause?: number;
}

export const DEFAULT_LINES: OverheardLine[] = [
  { quote: "Who made our launch video?", name: "Mia Okafor, CEO" },
  { quote: "I did. It’s in the repo.", name: "Leo Marsh, engineer" },
];

export const WORD = 4;
export const BETWEEN = 26;
const START = 6;
/** Extra frames after a word that ends a clause. */
const PAUSE = 10;
const RISE = 14;
/** The name follows its quote's last word by `NAME_LAG`. */
const NAME_LAG = 2;
const NAME_IN = 16;
const DIM = 16;

export interface Word {
  text: string;
  hot: boolean;
}

function stripQuotes(s: string) {
  return s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
}

/** A quote's words, curly quotes added, `hot` where `highlight` falls. */
export function wordsOf(quote: string, highlight: string): Word[] {
  const body = stripQuotes(quote);
  const at = highlight ? body.indexOf(highlight) : -1;
  const parts = body.split(" ").filter(Boolean);
  let cursor = 0;
  return parts.map((part, i) => {
    const s = body.indexOf(part, cursor);
    const e = s + part.length;
    cursor = e;
    let text = part;
    if (i === 0) text = `“${text}`;
    if (i === parts.length - 1) text = `${text}”`;
    return { text, hot: at >= 0 && s < at + highlight.length && e > at };
  });
}

/** The lines shown: the given ones, or the defaults when empty. */
export function linesOf(lines: OverheardLine[]) {
  return lines.length > 0 ? lines : DEFAULT_LINES;
}

// `word:<i>:<j>` rises word `j` of line `i`; the words of all lines form one
// chain. `name:<i>` rises line `i`'s speaker after its last word.
// `dim:<i>` dims line `i` as the next line's first word starts. `length` here
// is the clip length without `speed`, as the compression is counted.
export const overheardTimeline = defineTimeline<
  OverheardElementId,
  OverheardTimingProps
>(({ lines = DEFAULT_LINES, stagger = WORD, pause = BETWEEN }, { length }) => {
  const list = linesOf(lines);
  const n = list.length;
  const voices = list.map((l) => wordsOf(l.quote, ""));
  const natural: number[][] = [];
  const nameAt: number[] = [];
  const starts: number[] = [];
  let clock = START;
  voices.forEach((v, i) => {
    starts.push(clock);
    const times: number[] = [];
    v.forEach((wd) => {
      times.push(clock);
      clock += stagger;
      if (/[.?!,…]”?$/.test(wd.text)) clock += PAUSE;
    });
    natural.push(times);
    nameAt.push(clock + NAME_LAG);
    clock += i < n - 1 ? pause : 0;
  });
  const speechEnd = clock + RISE;
  const room = Math.max(1, length - Math.max(30, length * 0.2));
  const k = speechEnd > room ? room / speechEnd : 1;

  const elements: TimelineElement<OverheardElementId>[] = [];
  let prev: OverheardElementId | undefined;
  voices.forEach((v, i) => {
    v.forEach((wd, j) => {
      const id: OverheardElementId = `word:${i}:${j}`;
      elements.push({
        id,
        lane: `Line ${i + 1}`,
        label: wd.text,
        start: natural[i][j] * k,
        length: RISE,
        follows: prev,
      });
      prev = id;
    });
    elements.push({
      id: `name:${i}`,
      lane: `Line ${i + 1}`,
      label: list[i].name,
      start: nameAt[i] * k,
      length: NAME_IN,
      follows: prev,
    });
  });
  for (let i = 0; i < n - 1; i++) {
    elements.push({
      id: `dim:${i}`,
      lane: `Line ${i + 1}`,
      label: "dim",
      start: starts[i + 1] * k,
      length: DIM,
      follows: voices[i + 1].length > 0 ? `word:${i + 1}:0` : undefined,
    });
  }
  return elements.sort((a, b) => a.start - b.start);
});
