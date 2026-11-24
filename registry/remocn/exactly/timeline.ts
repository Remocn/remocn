import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each round: the objection building word by word in quotes, the quotes
// dropping as the reply lands and the line reflows around it, and the round
// leaving before the next one starts. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. When the rounds run past the clip, the schedule
// is compressed to fit (`k`). The ids are public: a saved `timing` prop
// refers to them.

export type ExactlyElementId =
  | `objection:${number}`
  | `reply:${number}`
  | `exit:${number}`;

export interface ExactlyRoundText {
  objection: string;
  reply: string;
}

export interface ExactlyTimingProps {
  rounds?: ExactlyRoundText[];
  stagger?: number;
  hold?: number;
}

export const DEFAULT_ROUNDS: ExactlyRoundText[] = [
  { objection: "There’s nothing to click.", reply: "Good." },
  { objection: "It’s just code.", reply: "Exactly." },
];

export const WORD = 3;
export const HOLD = 30;
const RISE = 13;
const DROP = 14;
const REFLOW = 20;
const REFLOW_AT = 6;
const EXIT = 12;
/** A round starts leaving this long before the next one starts. */
const EXIT_LEAD = 4;

/** The rounds shown: the defaults when the list is empty. */
export function roundsOf(rounds: ExactlyRoundText[]) {
  return rounds.length > 0 ? rounds : DEFAULT_ROUNDS;
}

/** The objection of a round as words. */
export function wordsOf(round: ExactlyRoundText) {
  return round.objection.trim().split(/\s+/);
}

// `objection:<i>` builds round `i`'s words `stagger` apart, each rising over
// `rise`. `reply:<i>` follows it: the quotes drop over `drop`, and from
// `reflow` the line reflows around the reply to the element's end. Every
// round but the last leaves (`exit:<i>`) just before the next objection;
// both follow the reply. `length` is the clip without `speed`, as the fit
// is counted from it.
export const exactlyTimeline = defineTimeline<
  ExactlyElementId,
  ExactlyTimingProps
>(({ rounds = DEFAULT_ROUNDS, stagger = WORD, hold = HOLD }, { length }) => {
  const T = length;
  const list = roundsOf(rounds);
  const objs = list.map(wordsOf);
  const startAt: number[] = [];
  const dropAt: number[] = [];
  let clock = 4;
  list.forEach((_, i) => {
    startAt.push(clock);
    clock += objs[i].length * stagger + RISE + 16;
    dropAt.push(clock);
    clock += REFLOW_AT + REFLOW;
    clock += i < list.length - 1 ? hold : 0;
  });
  const room = Math.max(1, T - Math.max(30, T * 0.2));
  const k = clock > room ? room / clock : 1;

  const elements: TimelineElement<ExactlyElementId>[] = [];
  list.forEach((round, i) => {
    elements.push(
      {
        id: `objection:${i}`,
        lane: "Objections",
        label: round.objection,
        start: startAt[i] * k,
        length: (dropAt[i] - startAt[i]) * k,
        follows: i > 0 ? `reply:${i - 1}` : undefined,
        beats: { stagger: stagger * k, rise: RISE * k },
      },
      {
        id: `reply:${i}`,
        lane: "Replies",
        label: round.reply,
        start: dropAt[i] * k,
        length: (REFLOW_AT + REFLOW) * k,
        follows: `objection:${i}`,
        beats: { drop: DROP * k, reflow: REFLOW_AT * k },
      },
    );
    if (i < list.length - 1) {
      elements.push({
        id: `exit:${i}`,
        lane: "Exits",
        label: round.objection,
        start: startAt[i + 1] * k - EXIT_LEAD,
        length: EXIT,
        follows: `reply:${i}`,
      });
    }
  });
  return elements;
});
