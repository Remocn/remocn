import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The slow push on the whole scene, the bar wiping in, the bar splitting
// into halves, quarters and eighths, the pieces regrouping around the accent
// piece, and the line rising in word by word. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FractionSplitElementId =
  | "push"
  | "wipe"
  | `split:${number}`
  | "regroup"
  | `word:${number}`;

export interface FractionSplitTimingProps {
  line?: string;
  highlight?: string;
  stagger?: number;
}

export const DEFAULT_LINE = "Renders in 1/8 the time.";
export const DEFAULT_HIGHLIGHT = "1/8";
export const DEFAULT_STAGGER = 3;

/** Each split: its first frame, its label and how many eighths a piece holds. */
export const LEVELS = [
  { at: 24, label: "1/2", size: 4 },
  { at: 50, label: "1/4", size: 2 },
  { at: 76, label: "1/8", size: 1 },
];
const REG = 104;
const REG_LEN = 26;
const TEXT_IN = REG + 12;
const WORD_RISE = 18;

/** The line as words, the highlight (and what is glued to it) as one. */
export function splitWords(line: string, highlight: string) {
  const idx = highlight ? line.indexOf(highlight) : -1;
  const words: { text: string; hl: boolean }[] = [];
  const pushWords = (s: string, hl: boolean) => {
    for (const w of s.split(/\s+/).filter(Boolean)) words.push({ text: w, hl });
  };
  if (idx >= 0) {
    pushWords(line.slice(0, idx), false);
    words.push({ text: highlight, hl: true });
    const rest = line.slice(idx + highlight.length);
    if (/^\S/.test(rest) && words.length) {
      const m = /^(\S+)(.*)$/.exec(rest);
      if (m) {
        words[words.length - 1] = {
          text: `${highlight}${m[1]}`,
          hl: true,
        };
        pushWords(m[2], false);
      }
    } else pushWords(rest, false);
  } else pushWords(line, false);
  return words;
}

// `push` scales the scene from its first frame to its end. `split:<i>`
// opens the boundaries of level `i` (the eighths open `spread` apart from the
// middle out); its labels rise from `labelIn` to `labelShown`, and fade out
// from `handover` (negative) before the next split. `regroup` moves the bar
// up and pulls the accent piece aside: the accent fills over `rise`, the
// other pieces drain from `drainAt` to `drainEnd`, `drainStep` apart, and the
// gradients drift over `drift`. `word:<i>` is a chain from inside the regroup.
export const fractionSplitTimeline = defineTimeline<
  FractionSplitElementId,
  FractionSplitTimingProps
>(
  ({
    line = DEFAULT_LINE,
    highlight = DEFAULT_HIGHLIGHT,
    stagger = DEFAULT_STAGGER,
  }) => {
    const words = splitWords(line, highlight);
    const elements: TimelineElement<FractionSplitElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "Push",
        start: 0,
        length: REG + REG_LEN + 40,
      },
      { id: "wipe", lane: "Bar", label: "Wipe", start: 2, length: 20 },
      ...LEVELS.map(
        (lv, i): TimelineElement<FractionSplitElementId> => ({
          id: `split:${i}`,
          lane: "Bar",
          label: lv.label,
          start: lv.at,
          length: (LEVELS[i + 1]?.at ?? REG) - lv.at,
          follows: i > 0 ? `split:${i - 1}` : undefined,
          beats: {
            spread: i === 2 ? 0.6 : 0,
            labelIn: 6,
            labelShown: 16,
            handover: -5,
          },
        }),
      ),
      {
        id: "regroup",
        lane: "Bar",
        label: "Regroup",
        start: REG,
        length: REG_LEN,
        follows: `split:${LEVELS.length - 1}`,
        beats: {
          rise: 16,
          drainAt: 2,
          drainEnd: 16,
          drainStep: 1.5,
          drift: REG_LEN + 50,
        },
      },
      ...words.map(
        (w, i): TimelineElement<FractionSplitElementId> => ({
          id: `word:${i}`,
          lane: "Line",
          label: w.text,
          start: TEXT_IN + i * stagger,
          length: WORD_RISE,
          follows: i > 0 ? `word:${i - 1}` : "regroup",
        }),
      ),
    ];
    return elements;
  },
);
