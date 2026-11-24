import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The commented lines rise in, then each one drops its comment marker and
// lights up. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type UncommentLineElementId = `rise:${number}` | `open:${number}`;

export interface UncommentLineTimingProps {
  lines?: string[];
  stagger?: number;
}

export const DEFAULT_LINES = [
  "Fork the scenes.",
  "Change anything.",
  "Own the cut.",
];
const RISE_LEN = 16;
const RISE_GAP = 4;
const OPEN_AT = 34;
const OPEN_GAP = 13;
const OPEN_LEN = 14;
/** The line starts lighting up this long into its uncommenting. */
const LIT_AT = 2;

/** The lines drawn: an empty list still draws one blank line. */
export const linesOf = (lines: string[]) => (lines.length > 0 ? lines : [" "]);

// `rise:<i>` is line i rising in, `open:<i>` its marker sliding away; each
// list is a chain.
export const uncommentLineTimeline = defineTimeline<
  UncommentLineElementId,
  UncommentLineTimingProps
>(({ lines = DEFAULT_LINES, stagger = OPEN_GAP }) => {
  const list = linesOf(lines);
  const rises = list.map(
    (line, i): TimelineElement<UncommentLineElementId> => ({
      id: `rise:${i}`,
      lane: "Rise",
      label: line,
      start: i * RISE_GAP,
      length: RISE_LEN,
      follows: i > 0 ? `rise:${i - 1}` : undefined,
    }),
  );
  const opens = list.map(
    (line, i): TimelineElement<UncommentLineElementId> => ({
      id: `open:${i}`,
      lane: "Uncomment",
      label: line,
      start: OPEN_AT + i * stagger,
      length: OPEN_LEN,
      follows: i > 0 ? `open:${i - 1}` : undefined,
      beats: { lit: LIT_AT },
    }),
  );
  return [...rises, ...opens].sort((a, b) => a.start - b.start);
});
