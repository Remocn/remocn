import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word of the answer rising in, the answer shrinking into the corner,
// and each word of the question rising in after it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. When the clip is too short for
// the motion plus a hold, the schedule is played up to 1/0.55 times faster
// (`fit`). The ids are public: a saved `timing` prop refers to them.

export type AnswerFirstElementId =
  | `answer:${number}`
  | "move"
  | `question:${number}`;

export interface AnswerFirstTimingProps {
  answer?: string;
  question?: string;
  moveAt?: number;
  stagger?: number;
}

export const DEFAULT_ANSWER = "A pull request.";
export const DEFAULT_QUESTION = "Who made this video?";
const A_LEN = 14;
const A_STAGGER = 3;
const MOVE_AT = 34;
const MOVE_LEN = 26;
const Q_AT = 46;
const Q_STAGGER = 4;
const Q_LEN = 14;
/** Frames the scene rests at the very end, kept even on a short clip. */
const MIN_HOLD = 26;
/** The smallest `fit`: a short clip speeds the schedule up 1/0.55 at most. */
const MIN_FIT = 0.55;

/** Words of a line, as the layout splits them. */
export function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// The answer's words form a chain. `move` is the answer shrinking into the
// corner; its `creep` beat (negative) is when the answer starts creeping
// larger before it. The question's words form a chain that follows the move.
// `length` is the clip length after `speed`: when the motion and the final
// hold don't fit, every start, length and beat shrinks by `fit`.
export const answerFirstTimeline = defineTimeline<
  AnswerFirstElementId,
  AnswerFirstTimingProps
>(
  (
    {
      answer = DEFAULT_ANSWER,
      question = DEFAULT_QUESTION,
      moveAt = MOVE_AT,
      stagger = Q_STAGGER,
    },
    { length },
  ) => {
    const aWords = split(answer);
    const qWords = split(question);
    const qAt = Q_AT + (moveAt - MOVE_AT);
    const qCount = qWords.length;
    const motionEnd = qAt + (qCount - 1) * stagger + Q_LEN;
    const room = length - MIN_HOLD;
    const fit = Math.max(MIN_FIT, Math.min(1, room / motionEnd));

    const elements: TimelineElement<AnswerFirstElementId>[] = aWords.map(
      (word, i): TimelineElement<AnswerFirstElementId> => ({
        id: `answer:${i}`,
        lane: "Answer",
        label: word,
        start: i * A_STAGGER * fit,
        length: A_LEN * fit,
        follows: i > 0 ? `answer:${i - 1}` : undefined,
      }),
    );
    elements.push({
      id: "move",
      lane: "Move",
      label: "move",
      start: moveAt * fit,
      length: MOVE_LEN * fit,
      beats: { creep: (A_LEN - moveAt) * fit },
    });
    qWords.forEach((word, i) => {
      elements.push({
        id: `question:${i}`,
        lane: "Question",
        label: word,
        start: (qAt + i * stagger) * fit,
        length: Q_LEN * fit,
        follows: i > 0 ? `question:${i - 1}` : "move",
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
