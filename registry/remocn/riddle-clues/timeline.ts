import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// For each clue, then the closer: its label and line rising in word by word,
// the line shifting over to make room, the turn rising in word by word, and
// (for every clue but the closer) the clue dropping out. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. When the clip is too short for
// the whole motion plus a hold, the schedule is played up to 1/0.6 times
// faster (`fit`). The ids are public: a saved `timing` prop refers to them.

export type RiddleCluesElementId =
  | `label:${number}`
  | `line:${number}:${number}`
  | `shift:${number}`
  | `turn:${number}:${number}`
  | `out:${number}`;

/** A line and the turn that answers it (`RiddleClue`). */
export interface ClueLines {
  line: string;
  turn: string;
}

export interface RiddleCluesTimingProps {
  clues?: ClueLines[];
  closer?: ClueLines;
  stagger?: number;
}

export const DEFAULT_CLUES: ClueLines[] = [
  { line: "It has scenes,", turn: "but no camera." },
  { line: "It has a timeline,", turn: "but no editor." },
  { line: "It has a release date,", turn: "but no name yet." },
];

export const DEFAULT_CLOSER: ClueLines = {
  line: "Give up?",
  turn: "Answer on the 14th.",
};

export const STAGGER = 3;

const STEP = 56;
const IN_LEN = 13;
const TURN_AT = 20;
const TURN_GAP = 4;
const SHIFT_LEN = 14;
const OUT_AT = 50;
const OUT_LEN = 9;
/** Frames the closer rests at the very end, kept even on a short clip. */
const MIN_HOLD = 30;
/** The smallest `fit`: a short clip speeds the schedule up 1/0.6 at most. */
const MIN_FIT = 0.6;

export function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// Item `i` is clue `i`; the closer is the last item. `label:<i>` raises the
// clue's label (the closer has none), `line:<i>:<j>` and `turn:<i>:<j>` are
// word `j` of its line and of its turn, each a chain. `shift:<i>` follows the
// line's first word and moves the line over as the turn arrives; the turn
// follows the shift. `out:<i>` follows the shift and drops the clue; the next
// item follows it. `length` is the clip length after `speed`: when the motion
// and the hold don't fit, every start and length shrinks by `fit`.
export const riddleCluesTimeline = defineTimeline<
  RiddleCluesElementId,
  RiddleCluesTimingProps
>(
  (
    { clues = DEFAULT_CLUES, closer = DEFAULT_CLOSER, stagger = STAGGER },
    { length },
  ) => {
    const all = [...clues, closer];
    const n = all.length;
    const lastTurnWords = splitWords(all[n - 1].turn).length;
    const motionEnd =
      (n - 1) * STEP + TURN_AT + 4 + (lastTurnWords - 1) * stagger + IN_LEN;
    const fit = Math.max(MIN_FIT, Math.min(1, (length - MIN_HOLD) / motionEnd));
    const elements: TimelineElement<RiddleCluesElementId>[] = [];
    let prevOut: RiddleCluesElementId | undefined;
    all.forEach((item, i) => {
      const s = i * STEP;
      const isLast = i === n - 1;
      const lineWords = splitWords(item.line);
      const turnWords = splitWords(item.turn);
      let lead = prevOut;
      if (!isLast) {
        elements.push({
          id: `label:${i}`,
          lane: "Labels",
          label: `clue ${i + 1}`,
          start: s * fit,
          length: IN_LEN * fit,
          follows: prevOut,
        });
        lead = `label:${i}`;
      }
      lineWords.forEach((word, j) => {
        elements.push({
          id: `line:${i}:${j}`,
          lane: "Lines",
          label: word,
          start: (s + j * stagger) * fit,
          length: IN_LEN * fit,
          follows: j > 0 ? `line:${i}:${j - 1}` : lead,
        });
      });
      elements.push({
        id: `shift:${i}`,
        lane: "Shifts",
        label: "shift",
        start: (s + TURN_AT) * fit,
        length: SHIFT_LEN * fit,
        follows: lineWords.length > 0 ? `line:${i}:0` : lead,
      });
      turnWords.forEach((word, j) => {
        elements.push({
          id: `turn:${i}:${j}`,
          lane: "Turns",
          label: word,
          start: (s + TURN_AT + TURN_GAP + j * stagger) * fit,
          length: IN_LEN * fit,
          follows: j > 0 ? `turn:${i}:${j - 1}` : `shift:${i}`,
        });
      });
      if (!isLast) {
        elements.push({
          id: `out:${i}`,
          lane: "Shifts",
          label: "out",
          start: (s + OUT_AT) * fit,
          length: OUT_LEN * fit,
          follows: `shift:${i}`,
        });
        prevOut = `out:${i}`;
      }
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
