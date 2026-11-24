import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each question pushing in from below and its answer block wiping in beside
// it, each quicker than the one before; the last one holds to the end.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The dwells
// shrink to fit the clip, leaving `hold` for the last answer. The ids are
// public: a saved `timing` prop refers to them.

export type YesRunElementId = `question:${number}`;

export interface YesRunTimingProps {
  questions?: string[];
  dwell?: number;
  hold?: number;
}

export const DEFAULT_QUESTIONS = [
  "Vertical?",
  "Captions?",
  "Your fonts?",
  "Dark mode?",
  "Transitions?",
  "Renders in CI?",
  "In your repo?",
  "Free?",
];

const FIRST_DWELL = 32;
const RATIO = 0.8;
const MIN_DWELL = 10;
const LAST_PUSH = 11;
const LAST_MIN = 44;
/** The push starts this many frames before the question's slot. */
const PUSH_LEAD = -2;

/** The questions shown: the defaults when the list is empty. */
export function questionsOf(questions: string[]) {
  return questions.length > 0 ? questions : DEFAULT_QUESTIONS;
}

// `question:<k>` runs until the next question takes over (the last one to
// the end of the clip). It pushes in from `lead` (negative) to `push`, and
// its answer wipes in from `yes` over `reveal`. The questions form a chain.
// `length` is the clip after `delay`, in scene frames.
export const yesRunTimeline = defineTimeline<
  YesRunElementId,
  YesRunTimingProps
>(
  (
    {
      questions = DEFAULT_QUESTIONS,
      dwell: firstDwell = FIRST_DWELL,
      hold = LAST_MIN,
    },
    { length },
  ) => {
    const qs = questionsOf(questions);
    const n = qs.length;
    const total = length;
    const natural = Array.from({ length: n - 1 }, (_, k) =>
      Math.max(MIN_DWELL, firstDwell * RATIO ** k),
    );
    const sum = natural.reduce((s, d) => s + d, 0);
    const fit = sum > 0 ? Math.min(1, (total - hold) / sum) : 1;
    const dwells = natural.map((d) => Math.max(7, Math.round(d * fit)));

    const elements: TimelineElement<YesRunElementId>[] = [];
    let at = 0;
    for (let k = 0; k < n; k++) {
      const last = k === n - 1;
      const dwell = last ? total - at : dwells[k];
      const push = last
        ? LAST_PUSH
        : Math.max(4, Math.min(9, Math.round(dwell * 0.4)));
      const yesAt = last
        ? push + 5
        : push + Math.round((dwell - push) * (k === 0 ? 0.3 : 0.18));
      const yesLen = last
        ? 8
        : Math.max(3, Math.min(6, Math.round(dwell * 0.22)));
      elements.push({
        id: `question:${k}`,
        lane: "Questions",
        label: qs[k],
        start: at,
        length: last ? Math.max(yesAt + yesLen, dwell) : dwell,
        follows: k > 0 ? `question:${k - 1}` : undefined,
        beats: { lead: PUSH_LEAD, push, yes: yesAt, reveal: yesLen },
      });
      at += dwell;
    }
    return elements;
  },
);
