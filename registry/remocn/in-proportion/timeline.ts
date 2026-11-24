import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// For each pair: the worry's words rising in big, the worry shrinking into a
// side note, the answer's words rising in, and (before the next pair) the
// answer leaving. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. When the pairs don't fit the clip with a final hold, every start
// and the shrink are squeezed by `k`; a word's own rise is not. The ids are
// public: a saved `timing` prop refers to them.

export type InProportionElementId =
  | `worry:${number}:${number}`
  | `shrink:${number}`
  | `answer:${number}:${number}`
  | `leave:${number}`;

/** One worry and its answer (`InProportionPair`). */
export interface ProportionPair {
  worry: string;
  answer: string;
}

export interface InProportionTimingProps {
  pairs?: ProportionPair[];
  stagger?: number;
  shrink?: number;
}

export const DEFAULT_PAIRS: ProportionPair[] = [
  { worry: "It’ll look homemade.", answer: "It’ll look like your app." },
  {
    worry: "I’ll get lost in keyframes.",
    answer: "You’ll write a component.",
  },
];

const WORD = 3;
const RISE = 13;
const SHRINK = 24;
const EXIT = 12;

/** The pairs shown: the default ones when `pairs` is empty. */
export function pairsOf(pairs: ProportionPair[]) {
  return pairs.length > 0 ? pairs : DEFAULT_PAIRS;
}

// `worry:<i>:<j>` and `answer:<i>:<j>` are word `j` of pair `i`; `shrink:<i>`
// turns worry `i` into a note, `leave:<i>` clears answer `i` before the next
// worry (the last answer stays). Everything is one chain: the words of a line
// follow each other, the shrink follows the worry's last word, the answer
// follows the shrink, the leave follows the answer's last word and the next
// worry follows the leave. `length` is the clip length without `speed`, as
// the squeeze is counted.
export const inProportionTimeline = defineTimeline<
  InProportionElementId,
  InProportionTimingProps
>(({ pairs = DEFAULT_PAIRS, stagger = WORD, shrink = SHRINK }, { length }) => {
  const list = pairsOf(pairs);
  const worries = list.map((p) => p.worry.trim().split(/\s+/));
  const answers = list.map((p) => p.answer.trim().split(/\s+/));
  const worryStart: number[] = [];
  const shrinkAt: number[] = [];
  const answerStart: number[] = [];
  let clock = 4;
  list.forEach((_, i) => {
    worryStart.push(clock);
    clock += worries[i].length * stagger + RISE + 16;
    shrinkAt.push(clock);
    answerStart.push(clock + 10);
    clock += 10 + answers[i].length * stagger + RISE;
    clock += i < list.length - 1 ? 24 : 0;
  });
  const room = Math.max(1, length - Math.max(30, length * 0.18));
  const k = clock > room ? room / clock : 1;

  const elements: TimelineElement<InProportionElementId>[] = [];
  let prev: InProportionElementId | undefined;
  const add = (e: Omit<TimelineElement<InProportionElementId>, "follows">) => {
    elements.push({ ...e, follows: prev });
    prev = e.id;
  };
  list.forEach((_, i) => {
    worries[i].forEach((word, j) => {
      add({
        id: `worry:${i}:${j}`,
        lane: "Worries",
        label: word,
        start: (worryStart[i] + j * stagger) * k,
        length: RISE,
      });
    });
    add({
      id: `shrink:${i}`,
      lane: "Notes",
      label: "shrink",
      start: shrinkAt[i] * k,
      length: shrink * k,
    });
    answers[i].forEach((word, j) => {
      add({
        id: `answer:${i}:${j}`,
        lane: "Answers",
        label: word,
        start: (answerStart[i] + j * stagger) * k,
        length: RISE,
      });
    });
    if (i < list.length - 1) {
      add({
        id: `leave:${i}`,
        lane: "Answers",
        label: "leave",
        start: worryStart[i + 1] * k - 2,
        length: EXIT,
      });
    }
  });
  return elements.sort((a, b) => a.start - b.start);
});
