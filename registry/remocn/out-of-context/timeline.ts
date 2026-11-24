import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The claim rising in line by line, close up; its full stop dropping away;
// the camera pulling back; and the rest of the line rising in word by word.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. When the
// clip is too short for the whole motion plus a hold, the schedule is played
// up to 1/0.55 times faster (`fit`). The ids are public: a saved `timing`
// prop refers to them.

export type OutOfContextElementId =
  | "claim"
  | "drop"
  | "pull"
  | `rest:${number}`;

export interface OutOfContextTimingProps {
  rest?: string;
  dropAt?: number;
  pullLen?: number;
}

export const DEFAULT_REST = "by hand.";
export const DROP_AT = 40;
export const PULL_LEN = 40;

const IN_LEN = 14;
const IN_STAGGER = 4;
const DROP_LEN = 9;
const PULL_AT = 46;
const REST_AT = 0.42;
const REST_LEN = 14;
const REST_STAGGER = 3;
const MOTION_END = 100;
/** Frames the line rests at the very end, kept even on a short clip. */
const MIN_HOLD = 24;
/** The smallest `fit`: a short clip speeds the schedule up 1/0.55 at most. */
const MIN_FIT = 0.55;

/** The words of a run of text. */
export function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// `claim` is the claim's first line rising in; line `l` starts `l` × `line`
// frames later (how many lines the claim takes is measured). The camera
// creeps in from the claim's end to the pull. `drop` is the full stop falling
// away, `pull` the camera pulling back, and `rest:<i>` word `i` of the rest of
// the line, a chain that follows the pull. `length` is the clip length after
// `speed`: when the motion and the hold don't fit, every start, length and
// beat shrinks by `fit`.
export const outOfContextTimeline = defineTimeline<
  OutOfContextElementId,
  OutOfContextTimingProps
>(
  (
    { rest = DEFAULT_REST, dropAt = DROP_AT, pullLen = PULL_LEN },
    { length },
  ) => {
    const fit = Math.max(
      MIN_FIT,
      Math.min(1, (length - MIN_HOLD) / MOTION_END),
    );
    const elements: TimelineElement<OutOfContextElementId>[] = [
      {
        id: "claim",
        lane: "Claim",
        label: "claim",
        start: 0,
        length: IN_LEN * fit,
        beats: { line: IN_STAGGER * fit },
      },
      {
        id: "drop",
        lane: "Claim",
        label: "full stop",
        start: dropAt * fit,
        length: DROP_LEN * fit,
      },
      {
        id: "pull",
        lane: "Camera",
        label: "pull back",
        start: PULL_AT * fit,
        length: pullLen * fit,
        follows: "claim",
      },
      ...splitWords(rest).map(
        (word, i): TimelineElement<OutOfContextElementId> => ({
          id: `rest:${i}`,
          lane: "Rest",
          label: word,
          start: (PULL_AT + pullLen * REST_AT + i * REST_STAGGER) * fit,
          length: REST_LEN * fit,
          follows: i > 0 ? `rest:${i - 1}` : "pull",
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
