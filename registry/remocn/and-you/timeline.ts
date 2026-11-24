import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The clauses building word by word down the page, the page scrolling to keep
// each new clause in view, then pulling back while the last line rises in, its
// last word a beat behind. The clause slot comes from the scene length (no
// `speed`). Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type AndYouElementId = `clause:${number}` | "pullback" | "last" | "tail";

export interface AndYouTimingProps {
  clauses?: string[];
  last?: string;
  /** Frames between words as a clause builds. */
  stagger?: number;
}

export const DEFAULT_CLAUSES = [
  "For the founder who launches on Monday,",
  "the designer who just learned React,",
  "the two-person studio,",
  "the student with a weekend project,",
];
export const FALLBACK_CLAUSES = ["For everyone who builds,"];
export const DEFAULT_LAST = "and you.";
const STAGGER = 2;
/** Frames a word takes to rise in. */
const WORD = 14;

// Clause `k` runs one slot: its words rise `stagger` apart over `word` frames
// each, and the page scrolls to it from `scrollFrom` to `scrollTo`. The
// pull-back and the last line hang off the end of the clauses; their visible
// motion sits at the beats, so the frames match the old sums exactly.
export const andYouTimeline = defineTimeline<
  AndYouElementId,
  AndYouTimingProps
>(
  (
    { clauses = DEFAULT_CLAUSES, last = DEFAULT_LAST, stagger = STAGGER },
    { length },
  ) => {
    const list = clauses.length > 0 ? clauses : FALLBACK_CLAUSES;
    const n = list.length;
    const D = Math.max(110, length);
    const start = 6;
    const cl = Math.min(30, Math.max(14, (D * 0.56 - start) / n));
    const clauseAt = (k: number) => start + k * cl;
    const finalAt = clauseAt(n);
    const lastClause: AndYouElementId = `clause:${n - 1}`;

    const elements: TimelineElement<AndYouElementId>[] = list.map(
      (text, k) => ({
        id: `clause:${k}`,
        lane: "Clauses",
        label: text,
        start: clauseAt(k),
        length: cl,
        follows: k > 0 ? `clause:${k - 1}` : undefined,
        beats: { scrollFrom: -2, scrollTo: 12, stagger, word: WORD },
      }),
    );
    elements.push(
      {
        id: "pullback",
        lane: "Page",
        label: "pull back",
        start: finalAt,
        length: 16,
        follows: lastClause,
        beats: { lead: -4 },
      },
      {
        id: "last",
        lane: "Last line",
        label: last,
        start: finalAt,
        length: 22,
        follows: lastClause,
        beats: { enter: 4 },
      },
      {
        id: "tail",
        lane: "Last word",
        label: last.slice(last.lastIndexOf(" ") + 1),
        start: finalAt,
        length: 26,
        follows: lastClause,
        beats: { enter: 8 },
      },
    );
    return elements;
  },
);
