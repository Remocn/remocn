import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The baseline rules drawing in row by row, the letters rising in one after
// another across the rows, and the serif sweep: each letter narrowing from
// the wide weight while its serifs grow. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SerifRiseElementId = `rule:${number}` | `line:${number}` | "serifs";

export interface SerifRiseTimingProps {
  lines?: string[];
  stagger?: number;
}

export const DEFAULT_LINES = ["From rough cut", "to final cut."];

const RULE_GAP = 4;
const RULE_DRAW = 22;
const RISE_LEN = 18;
const RISE_GAP = 1.5;
const SWEEP_AT = 32;
const SWEEP_GAP = 2;
const SWEEP_SPAN = 44;
const SWEEP_LEN = 16;

/** The rows drawn: a lone "final cut." when the list is empty. */
export function rowsOf(lines: string[]) {
  return (lines.length > 0 ? lines : ["final cut."]).map((l) => l || " ");
}

// `rule:<r>` draws row r's rule; the rules form a chain. `line:<r>` raises
// row r's letters, `stagger` apart, each over `rise`; the letters count on
// across the rows, so the lines form a chain too. `serifs` sweeps every
// letter in reading order, `gap` apart, each over `letter`.
export const serifRiseTimeline = defineTimeline<
  SerifRiseElementId,
  SerifRiseTimingProps
>(({ lines = DEFAULT_LINES, stagger = RISE_GAP }) => {
  const rows = rowsOf(lines);
  const total = rows.reduce((a, r) => a + Array.from(r).length, 0);
  const gap = Math.min(SWEEP_GAP, SWEEP_SPAN / Math.max(1, total - 1));
  const elements: TimelineElement<SerifRiseElementId>[] = [];
  let gi = 0;
  rows.forEach((row, r) => {
    const n = Array.from(row).length;
    elements.push(
      {
        id: `rule:${r}`,
        lane: "Rules",
        label: `rule ${r + 1}`,
        start: r * RULE_GAP,
        length: RULE_DRAW,
        follows: r > 0 ? `rule:${r - 1}` : undefined,
      },
      {
        id: `line:${r}`,
        lane: "Letters",
        label: row,
        start: gi * stagger,
        length: Math.max(0, n - 1) * stagger + RISE_LEN,
        follows: r > 0 ? `line:${r - 1}` : undefined,
        beats: { stagger, rise: RISE_LEN },
      },
    );
    gi += n;
  });
  elements.push({
    id: "serifs",
    lane: "Serifs",
    label: "serif sweep",
    start: SWEEP_AT,
    length: Math.max(0, total - 1) * gap + SWEEP_LEN,
    beats: { gap, letter: SWEEP_LEN },
  });
  return elements.sort((a, b) => a.start - b.start);
});
