import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The label and the list of chores building line by line, the list folding
// into its middle line round by round, that line leaving as the hero rises
// in word by word, and the payoff under it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The list is read for as long as the
// clip allows. The ids are public: a saved `timing` prop refers to them.

export type ChoreFoldElementId =
  | "label"
  | `line:${number}`
  | `round:${number}`
  | "swap"
  | "hero"
  | "payoff";

export interface ChoreFoldTimingProps {
  steps?: string[];
  label?: string;
  name?: string;
  result?: string;
  payoff?: string;
  lineStagger?: number;
  stagger?: number;
}

export const DEFAULT_STEPS = [
  "Export the audio.",
  "Send it off for a transcript.",
  "Fix every timestamp by hand.",
  "Style each line to match.",
  "Render the whole film again.",
];
export const DEFAULT_LABEL = "By hand";
export const DEFAULT_NAME = "Captions";
export const DEFAULT_RESULT = "does all of that.";
export const DEFAULT_PAYOFF = "You just talk.";

export const LINE_GAP = 8;
export const WORD_STAGGER = 2;
const LABEL_AT = 2;
const LABEL_IN = 12;
const LABEL_OUT = 10;
const LINE_AT = 6;
const WORD_IN = 13;
const ROUND = [17, 13, 11, 10, 9];
const ROUND_GAP = 3;
const SWAP_LEAD = 5;
const SWAP_OUT = 10;
const SWAP_IN = 18;
const HERO_AFTER = 4;
const PAYOFF_AFTER = 16;
const PAYOFF_IN = 16;
const HOLD = 40;

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

/** The steps shown: the defaults when the list is empty. */
export function stepsOf(steps: string[]) {
  return steps.length > 0 ? steps : DEFAULT_STEPS;
}

// `line:<i>` is step `i` rising in word by word (`stagger` apart, each over
// `rise`); the lines form a chain. `round:<r>` is one round of the fold;
// the rounds follow the last line and each other, and the label leaves over
// the first round's `labelOut`. `swap` is the last standing line leaving,
// `hero` the hero rising in word by word, `payoff` the line under it; each
// follows the one before.
export const choreFoldTimeline = defineTimeline<
  ChoreFoldElementId,
  ChoreFoldTimingProps
>(
  (
    {
      steps = DEFAULT_STEPS,
      label = DEFAULT_LABEL,
      name = DEFAULT_NAME,
      result = DEFAULT_RESULT,
      payoff = DEFAULT_PAYOFF,
      lineStagger = LINE_GAP,
      stagger = WORD_STAGGER,
    },
    { length },
  ) => {
    const list = stepsOf(steps);
    const n = list.length;
    const heroCount = splitWords(name).length + splitWords(result).length;
    const D = (n - 1) / 2;
    const rounds = Math.max(1, Math.ceil(D));
    const roundDur = (r: number) => ROUND[Math.min(r, ROUND.length - 1)];
    let foldLen = 0;
    for (let r = 0; r < rounds; r++) foldLen += roundDur(r) + ROUND_GAP;

    const linesDone = LINE_AT + (n - 1) * lineStagger + 16;
    const tail = foldLen + SWAP_LEAD + SWAP_IN + PAYOFF_AFTER + 14 + HOLD;
    const span = length;
    const read = Math.min(70, Math.max(18, span - linesDone - tail));
    const foldAt = linesDone + read;

    const elements: TimelineElement<ChoreFoldElementId>[] = [];
    if (label) {
      elements.push({
        id: "label",
        lane: "Label",
        label,
        start: LABEL_AT,
        length: LABEL_IN,
      });
    }
    list.forEach((line, i) => {
      elements.push({
        id: `line:${i}`,
        lane: "Steps",
        label: line,
        start: LINE_AT + i * lineStagger,
        length: Math.max(0, splitWords(line).length - 1) * stagger + WORD_IN,
        follows: i > 0 ? `line:${i - 1}` : undefined,
        beats: { stagger, rise: WORD_IN },
      });
    });
    let from = foldAt;
    for (let r = 0; r < rounds; r++) {
      elements.push({
        id: `round:${r}`,
        lane: "Fold",
        label: `round ${r + 1}`,
        start: from,
        length: roundDur(r),
        follows: r > 0 ? `round:${r - 1}` : `line:${n - 1}`,
        beats: r === 0 ? { labelOut: LABEL_OUT } : undefined,
      });
      from += roundDur(r) + ROUND_GAP;
    }
    const foldEnd = from;
    const swapAt = foldEnd + SWAP_LEAD - ROUND_GAP;
    const heroAt = swapAt + HERO_AFTER;
    const payoffAt = heroAt + PAYOFF_AFTER;
    elements.push(
      {
        id: "swap",
        lane: "Hero",
        label: "swap",
        start: swapAt,
        length: SWAP_OUT,
        follows: `round:${rounds - 1}`,
      },
      {
        id: "hero",
        lane: "Hero",
        label: name,
        start: heroAt,
        length: Math.max(0, heroCount - 1) * stagger + SWAP_IN,
        follows: "swap",
        beats: { stagger, rise: SWAP_IN },
      },
    );
    if (payoff) {
      elements.push({
        id: "payoff",
        lane: "Payoff",
        label: payoff,
        start: payoffAt,
        length: PAYOFF_IN,
        follows: "hero",
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
