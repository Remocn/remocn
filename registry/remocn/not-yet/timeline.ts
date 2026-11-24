import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The rule drawing in, then line by line: the line steps in (pushing the
// older ones up and smaller), its words rise one after another, and the
// accent word lands after a pause. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. When the natural schedule runs past the clip,
// it is compressed to fit (`pace`). The ids are public: a saved `timing`
// prop refers to them.

export type NotYetElementId = "rule" | `line:${number}` | `yet:${number}`;

export interface NotYetTimingProps {
  lines?: string[];
  /** Frames between words as a line builds. */
  stagger?: number;
}

export const DEFAULT_LINES = [
  "It can’t write your script.",
  "It can’t pick your music.",
  "It can’t voice your launch.",
];

const WORD_GAP = 3;
const WORD_RISE = 12;
const YET_PAUSE = 9;
const YET_HOLD = 20;
const YET_IN = 8;
const STEP_DUR = 16;
const RULE_IN = 22;
/** The scene settles this long after the last accent word starts. */
const SETTLE = 10;

export function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// `line:<i>` runs from the line stepping in (`step` long, none for the first)
// to its accent word; its words rise from `words`, `stagger` apart, each over
// `rise`. `yet:<i>` is the accent word sliding in; the next line follows it.
// `length` here is the clip length without `speed`, as the pace is counted.
export const notYetTimeline = defineTimeline<
  NotYetElementId,
  NotYetTimingProps
>(({ lines = DEFAULT_LINES, stagger = WORD_GAP }, { length }) => {
  const wordLines = lines.map(splitWords);
  const starts: number[] = [];
  const leads: number[] = [];
  const yets: number[] = [];
  let at = 0;
  for (const words of wordLines) {
    starts.push(at);
    const lead = at === 0 ? 0 : STEP_DUR - 6;
    leads.push(lead);
    const set = lead + 2 + (words.length - 1) * stagger + WORD_RISE;
    const yet = at + set + YET_PAUSE;
    yets.push(yet);
    at = yet + YET_HOLD;
  }
  const end = (yets[yets.length - 1] ?? 0) + SETTLE;
  const pace = Math.max(1, (end + 30) / Math.max(1, length));

  const elements: TimelineElement<NotYetElementId>[] = [
    {
      id: "rule",
      lane: "Rule",
      label: "rule",
      start: 0,
      length: RULE_IN / pace,
    },
  ];
  wordLines.forEach((_, i) => {
    elements.push(
      {
        id: `line:${i}`,
        lane: "Lines",
        label: lines[i],
        start: starts[i] / pace,
        length: (yets[i] - starts[i]) / pace,
        follows: i > 0 ? `yet:${i - 1}` : undefined,
        beats: {
          step: STEP_DUR / pace,
          words: (leads[i] + 2) / pace,
          stagger: stagger / pace,
          rise: WORD_RISE / pace,
        },
      },
      {
        id: `yet:${i}`,
        lane: "Lines",
        label: "accent word",
        start: yets[i] / pace,
        length: YET_IN / pace,
        follows: `line:${i}`,
      },
    );
  });
  return elements;
});
