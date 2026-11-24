import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line coming in (each plain word rising, each blank drawing its rule
// and label), then each blank filling with its word. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The motion is paced to the clip
// (`pace`, 0.5 to 1.5) so the last fill leaves a tail to read. The ids are
// public: a saved `timing` prop refers to them.

export type PitchBlanksElementId =
  | `word:${number}`
  | `blank:${number}`
  | `fill:${number}`;

export interface PitchBlanksTimingProps {
  line?: string;
  labels?: string[];
  firstFill?: number;
  fillGap?: number;
  delay?: number;
}

export const DEFAULT_LINE =
  "{remocn} is a {launch-film kit} for {teams of one}.";
export const DEFAULT_LABELS = ["product", "category", "audience"];
const FIRST_FILL = 42;
const FILL_GAP = 32;
const MOTION_TAIL = 24;
const WORD_STAGGER = 2;
const WORD_RISE = 16;
const RULE_AT = 4;
const RULE_DRAW = 18;
const LABEL_AT = 8;
const LABEL_IN = 16;
const FILL = 14;
const FILL_WORD_AT = 10;
const FILL_WORD = 16;

export interface Tok {
  text: string;
  attach: boolean;
  blank: number;
  label: string;
}

/** The line as tokens: plain words, and each `{blank}` with its label. */
export function parse(line: string, labels: string[]) {
  const toks: Tok[] = [];
  const re = /\{([^}]*)\}/g;
  let last = 0;
  let n = 0;
  let glue = false;
  const pushText = (s: string) => {
    if (!s) return;
    const lead = /^\s/.test(s);
    const parts = s.split(/\s+/).filter(Boolean);
    parts.forEach((p, i) => {
      toks.push({
        text: p,
        attach: i === 0 && !lead && glue,
        blank: -1,
        label: "",
      });
    });
    glue = !/\s$/.test(s);
  };
  for (let m = re.exec(line); m; m = re.exec(line)) {
    pushText(line.slice(last, m.index));
    const attach = toks.length > 0 && glue;
    toks.push({
      text: m[1].trim(),
      attach,
      blank: n,
      label: labels[n] ?? "",
    });
    n++;
    glue = true;
    last = m.index + m[0].length;
  }
  pushText(line.slice(last));
  return { toks, blanks: n };
}

// Tokens come in `2` frames apart in line order: `word:<k>` is the k-th
// plain word, `blank:<b>` the b-th blank, whose rule draws over `draw` and
// whose label fades in from `label` to its end. `fill:<b>` fills blank `b`:
// the rule widens and takes the accent over `fill`, and the word rises in
// from `word` to its end. Words, blanks and fills are each a chain.
// `length` is the clip without `speed`, as the pace is counted from it and
// `delay`.
export const pitchBlanksTimeline = defineTimeline<
  PitchBlanksElementId,
  PitchBlanksTimingProps
>(
  (
    {
      line = DEFAULT_LINE,
      labels = DEFAULT_LABELS,
      firstFill = FIRST_FILL,
      fillGap = FILL_GAP,
      delay = 0,
    },
    { length },
  ) => {
    const T = length;
    const { toks, blanks } = parse(line, labels);
    const motionEnd =
      firstFill + Math.max(0, blanks - 1) * fillGap + MOTION_TAIL;
    const tail = Math.max(30, T * 0.18);
    const pace = Math.min(1.5, Math.max(0.5, (T - delay - tail) / motionEnd));

    const elements: TimelineElement<PitchBlanksElementId>[] = [];
    let word = 0;
    toks.forEach((tk, i) => {
      if (tk.blank < 0) {
        elements.push({
          id: `word:${word}`,
          lane: "Words",
          label: tk.text,
          start: i * WORD_STAGGER * pace,
          length: WORD_RISE * pace,
          follows: word > 0 ? `word:${word - 1}` : undefined,
        });
        word++;
      } else {
        elements.push({
          id: `blank:${tk.blank}`,
          lane: "Blanks",
          label: tk.label,
          start: (RULE_AT + i * WORD_STAGGER) * pace,
          length: (LABEL_AT + LABEL_IN) * pace,
          follows: tk.blank > 0 ? `blank:${tk.blank - 1}` : undefined,
          beats: { draw: RULE_DRAW * pace, label: LABEL_AT * pace },
        });
      }
    });
    toks.forEach((tk) => {
      if (tk.blank < 0) return;
      const b = tk.blank;
      elements.push({
        id: `fill:${b}`,
        lane: "Fills",
        label: tk.text,
        start: (firstFill + b * fillGap) * pace,
        length: (FILL_WORD_AT + FILL_WORD) * pace,
        follows: b > 0 ? `fill:${b - 1}` : undefined,
        beats: { fill: FILL * pace, word: FILL_WORD_AT * pace },
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
