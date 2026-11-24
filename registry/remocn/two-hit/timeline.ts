import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lines rise in, a small hit spreads the letters, then a full hit swaps
// the copy. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type TwoHitElementId = `line:${number}` | "hit:0" | "hit:1";

export interface TwoHitTimingProps {
  before?: string;
  after?: string;
  hitAt?: number;
  hitGap?: number;
}

export const DEFAULT_BEFORE = "Premieres Friday.";
export const DEFAULT_AFTER = "Streaming now.";
const HIT_AT = 34;
const HIT_GAP = 24;
/** Line `j` rises over `RISE` frames from `ENTER_AT + j * ENTER_STAGGER`. */
const ENTER_AT = 2;
const ENTER_STAGGER = 4;
const RISE = 18;

/** A phrase as its lines: the last word on a line of its own. */
export function splitLast(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  const i = clean.lastIndexOf(" ");
  if (i < 0) return [clean];
  return [clean.slice(0, i), clean.slice(i + 1)];
}

/** Both phrases, with the fallbacks an empty one gets. */
export function phrasesOf(before: string, after: string) {
  return [
    splitLast(before.trim() || "Soon."),
    splitLast(after.trim() || "Now."),
  ];
}

// `line:<j>` is row j rising in. Each hit swells the tracking over `attack`,
// holds and lets go over `release`; the second hit swaps to `after` at its
// `swap` beat.
export const twoHitTimeline = defineTimeline<
  TwoHitElementId,
  TwoHitTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    after = DEFAULT_AFTER,
    hitAt = HIT_AT,
    hitGap = HIT_GAP,
  }) => {
    const phrases = phrasesOf(before, after);
    const rows = Math.max(phrases[0].length, phrases[1].length);
    const lines = Array.from(
      { length: rows },
      (_, j): TimelineElement<TwoHitElementId> => ({
        id: `line:${j}`,
        lane: "Lines",
        label: phrases[0][j] ?? phrases[1][j],
        start: ENTER_AT + j * ENTER_STAGGER,
        length: RISE,
        follows: j > 0 ? `line:${j - 1}` : undefined,
      }),
    );
    const h1 = hitAt;
    const h2 = hitAt + hitGap;
    const hits: TimelineElement<TwoHitElementId>[] = [
      {
        id: "hit:0",
        lane: "Hits",
        label: "small hit",
        start: h1,
        length: 4 + 0 + 16,
        beats: { attack: 4, hold: 0, release: 16 },
      },
      {
        id: "hit:1",
        lane: "Hits",
        label: "full hit",
        start: h2,
        length: 5 + 4 + 24,
        follows: "hit:0",
        beats: { attack: 5, hold: 4, release: 24, swap: 7 },
      },
    ];
    return [...lines, ...hits].sort((a, b) => a.start - b.start);
  },
);
