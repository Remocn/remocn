import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The slow push on the text plane, the focus moving down the lines one by
// one, landing on the payoff line, the payoff's words rising, the accent word
// lighting up and the meta row under it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FocusPanTextElementId =
  | "push"
  | `move:${number}`
  | "payoff"
  | `word:${number}`
  | "accent"
  | "meta";

export interface FocusPanTextTimingProps {
  lines?: string[];
  firstHold?: number;
  stagger?: number;
}

export const BEAT = {
  decay: 0.8,
  minHold: 18,
  move: 14,
  payoffMove: 24,
  wordIn: 12,
  wordStagger: 3,
  accent: 20,
  color: 10,
  meta: 24,
  hold: 48,
  settle: 40,
};

export const DEFAULT_LINES = [
  "The security scan is clean.",
  "All 48 checks passed.",
  "Your domain is live.",
  "You're ready to launch.",
];
export const FIRST_HOLD = 30;

/** Frames line `i` holds the focus before it moves on. */
export const holdOf = (i: number, first: number) =>
  Math.max(BEAT.minHold, Math.round(first * BEAT.decay ** i));

/** The lines shown: the defaults when the list is empty. */
export const linesOf = (lines: string[]) =>
  lines.length > 0 ? lines : DEFAULT_LINES;

export const wordsOf = (line: string) => line.split(/\s+/).filter(Boolean);

// `push` is the camera's push over the whole scene, to the frame the focus
// rests on. `move:<i>` is the focus moving onto line `i`, `payoff` onto the
// last line (a spring; the plane settles over `settle`). `word:<k>` is the
// payoff's word `k` rising. The moves, then the words, form a chain;
// `accent` and `meta` follow the payoff.
export const focusPanTextTimeline = defineTimeline<
  FocusPanTextElementId,
  FocusPanTextTimingProps
>(
  ({
    lines = DEFAULT_LINES,
    firstHold = FIRST_HOLD,
    stagger = BEAT.wordStagger,
  }) => {
    const safeLines = linesOf(lines);
    const last = safeLines.length - 1;
    const moves: { at: number; line: number }[] = [];
    let t = 0;
    for (let i = 1; i <= last; i++) {
      t += holdOf(i - 1, firstHold);
      moves.push({ at: t, line: i });
    }
    const payoffAt = moves.length ? moves[moves.length - 1].at : 0;
    const before = last > 1 ? (`move:${last - 1}` as const) : undefined;

    const elements: TimelineElement<FocusPanTextElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "push",
        start: 0,
        length: payoffAt + BEAT.payoffMove + BEAT.meta + BEAT.hold,
      },
    ];
    for (const mv of moves.slice(0, -1)) {
      elements.push({
        id: `move:${mv.line}`,
        lane: "Focus",
        label: safeLines[mv.line],
        start: mv.at,
        length: BEAT.move,
        follows: mv.line > 1 ? `move:${mv.line - 1}` : undefined,
      });
    }
    elements.push({
      id: "payoff",
      lane: "Focus",
      label: safeLines[last],
      start: payoffAt,
      length: BEAT.payoffMove,
      follows: before,
      beats: { settle: BEAT.settle },
    });
    wordsOf(safeLines[last]).forEach((w, k) => {
      elements.push({
        id: `word:${k}`,
        lane: "Payoff",
        label: w,
        start: payoffAt + k * stagger,
        length: BEAT.wordIn,
        follows: k > 0 ? `word:${k - 1}` : before,
      });
    });
    elements.push(
      {
        id: "accent",
        lane: "Accent",
        label: "accent",
        start: payoffAt + BEAT.accent,
        length: BEAT.color,
        follows: "payoff",
      },
      {
        id: "meta",
        lane: "Meta",
        label: "meta",
        start: payoffAt + BEAT.meta,
        length: BEAT.hold,
        follows: "payoff",
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
