import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each letter's dot arriving, a breath rippling across the dots, and each
// dot opening into its letter. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type UnmaskLineElementId =
  | `dot:${number}`
  | "breath"
  | `letter:${number}`;

export interface UnmaskLineTimingProps {
  lines?: string[];
  openAt?: number;
  stagger?: number;
}

export const DEFAULT_LINES = ["Out of", "stealth."];
/** Dots arrive `DOT_GAP` apart over `DOT_LEN`; each line `LINE_LAG` later. */
const DOT_GAP = 1.2;
const DOT_LEN = 10;
const LINE_LAG = 4;
/** The breath swells each dot over `BREATH_LEN`, `BREATH_GAP` apart. */
const BREATH_AT = 18;
const BREATH_GAP = 1.4;
const BREATH_LEN = 12;
/** A dot opens into its letter over `OPEN_LEN`. */
const OPEN_AT = 38;
const OPEN_GAP = 2.2;
const OPEN_LEN = 12;

/** The lines drawn, one blank line when there are none. */
export function linesOf(lines: string[]) {
  return lines.length > 0 ? lines : [" "];
}

// `<i>` counts the letters across all lines, spaces skipped. The dots and the
// letters are chains; the breath is one element, the dots swelling `gap`
// apart for `pulse` frames each.
export const unmaskLineTimeline = defineTimeline<
  UnmaskLineElementId,
  UnmaskLineTimingProps
>(({ lines = DEFAULT_LINES, openAt = OPEN_AT, stagger = OPEN_GAP }) => {
  const letters: { ch: string; li: number }[] = [];
  linesOf(lines).forEach((line, li) => {
    for (const ch of Array.from(line)) {
      if (ch !== " ") letters.push({ ch, li });
    }
  });
  const elements: TimelineElement<UnmaskLineElementId>[] = [];
  letters.forEach(({ ch, li }, i) => {
    elements.push({
      id: `dot:${i}`,
      lane: "Dots",
      label: ch,
      start: li * LINE_LAG + i * DOT_GAP,
      length: DOT_LEN,
      follows: i > 0 ? `dot:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "breath",
    lane: "Breath",
    label: "Breath",
    start: BREATH_AT,
    length: Math.max(0, letters.length - 1) * BREATH_GAP + BREATH_LEN,
    beats: { gap: BREATH_GAP, pulse: BREATH_LEN },
  });
  letters.forEach(({ ch }, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Letters",
      label: ch,
      start: openAt + i * stagger,
      length: OPEN_LEN,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
    });
  });
  // Stable, so a chain keeps its order on equal starts.
  return elements.sort((a, b) => a.start - b.start);
});
