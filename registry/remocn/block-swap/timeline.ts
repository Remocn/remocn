import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Line by line: the blocks cover the words on screen, morph into the next
// line's word shapes, show the new words knocked out of them and wipe away
// to uncover the line. The first line's blocks spawn in instead of
// covering. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type BlockSwapElementId = `line:${number}`;

export interface BlockSwapTimingProps {
  lines?: string[];
  hold?: number;
}

export const DEFAULT_LINES = ["Pick the beats you need.", "Render the launch."];
export const HOLD = 14;
export const END_HOLD = 30;

const STAGGER = 2;
const RUN = 10;
const MORPH = 20;
const MORPH_STAGGER = 1;
const TEXT_IN = 6;
const OPEN_SPAWN = 2;

/** One line's swap, in frames on the scene timeline. */
export interface SwapPlan {
  start: number;
  covered: number;
  morphAt: number;
  textAt: number;
  uncoverAt: number;
  end: number;
}

/** The lines shown: the defaults when the list is empty. */
export function linesOf(lines: string[]) {
  return lines.length > 0 ? lines : DEFAULT_LINES;
}

export const wordCount = (line: string) =>
  line.split(/\s+/).filter(Boolean).length;

/** Each line's swap, with `hold` frames between the end of one and the next. */
export function planSwaps(counts: number[], hold: number): SwapPlan[] {
  const out: SwapPlan[] = [];
  let at = 0;
  counts.forEach((n, i) => {
    if (i === 0) {
      const covered = OPEN_SPAWN + (n - 1) * STAGGER + RUN + 2;
      const textAt = covered;
      const uncoverAt = textAt + TEXT_IN;
      const end = uncoverAt + (n - 1) * STAGGER + RUN;
      out.push({ start: 0, covered, morphAt: 0, textAt, uncoverAt, end });
      at = end + hold;
      return;
    }
    const m = counts[i - 1];
    const k = Math.max(m, n);
    const covered = at + (m - 1) * STAGGER + RUN;
    const morphAt = covered - 2;
    const textAt = morphAt + MORPH + (k - 1) * MORPH_STAGGER;
    const uncoverAt = textAt + TEXT_IN;
    const end = uncoverAt + (n - 1) * STAGGER + RUN;
    out.push({ start: at, covered, morphAt, textAt, uncoverAt, end });
    at = end + hold;
  });
  return out;
}

// `line:<i>` swaps line i in, from its first block moving to its last
// block uncovered. Its beats are moments from its start (`covered`,
// `morphAt`, `textAt`, `uncoverAt`) and the frame counts the blocks move by
// (`spawn`, `stagger`, `run`, `morph`, `morphStagger`, `textIn`). The lines
// form a chain, `hold` frames apart.
export const blockSwapTimeline = defineTimeline<
  BlockSwapElementId,
  BlockSwapTimingProps
>(({ lines = DEFAULT_LINES, hold = HOLD }) => {
  const list = linesOf(lines);
  const swaps = planSwaps(list.map(wordCount), hold);
  return swaps.map(
    (s, i): TimelineElement<BlockSwapElementId> => ({
      id: `line:${i}`,
      lane: "Lines",
      label: list[i],
      start: s.start,
      length: s.end - s.start,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: {
        covered: s.covered - s.start,
        morphAt: s.morphAt - s.start,
        textAt: s.textAt - s.start,
        uncoverAt: s.uncoverAt - s.start,
        spawn: OPEN_SPAWN,
        stagger: STAGGER,
        run: RUN,
        morph: MORPH,
        morphStagger: MORPH_STAGGER,
        textIn: TEXT_IN,
      },
    }),
  );
});
