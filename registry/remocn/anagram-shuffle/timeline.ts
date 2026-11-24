import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first word's letters rising in, each letter leaving for its place in
// the second word, the letters the first word lacks fading in, and the accent
// running through the new word. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type AnagramShuffleElementId =
  | `enter:${number}`
  | `letter:${number}`
  | `arrive:${number}`
  | `accent:${number}`;

export interface AnagramShuffleTimingProps {
  from?: string;
  to?: string;
  stagger?: number;
  travel?: number;
}

export const DEFAULT_SOURCE = "listen";
export const DEFAULT_TARGET = "silent";
export const LETTER_STAGGER = 3;
export const LETTER_TRAVEL = 30;

const ENTER_STAGGER = 2;
const ENTER = 16;
const SHUFFLE_AT = 34;
const ACCENT_GAP = 10;
const ACCENT_STAGGER = 3;
const ACCENT_LEN = 12;

/**
 * For each letter of `b`, the letter of `a` that travels to it (-1 when `a`
 * has none left), and the letters of `a` no letter of `b` takes.
 */
export function mapLetters(a: string[], b: string[]) {
  const used = new Array<boolean>(a.length).fill(false);
  const pick = (j: number, same: (x: string, y: string) => boolean) => {
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    a.forEach((ch, i) => {
      if (used[i] || !same(ch, b[j])) return;
      const d = Math.abs(i / Math.max(1, a.length) - j / Math.max(1, b.length));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) used[best] = true;
    return best;
  };
  const src = b.map((_, j) => pick(j, (x, y) => x === y));
  src.forEach((s, j) => {
    if (s < 0) src[j] = pick(j, (x, y) => x.toLowerCase() === y.toLowerCase());
  });
  const orphans = a.map((_, i) => i).filter((i) => !used[i]);
  return { src, orphans };
}

// `enter:<i>` is letter `i` of the first word rising in; `letter:<i>` is the
// same letter travelling to its new place (or fading out when the second
// word has no place for it). `arrive:<j>` is letter `j` of the second word
// that no letter travels to, fading in from `fade` with the last letter's
// travel. `accent:<j>` is letter `j` of the second word taking the accent.
// Each list is a chain; the accents follow the last letter's travel.
export const anagramShuffleTimeline = defineTimeline<
  AnagramShuffleElementId,
  AnagramShuffleTimingProps
>(
  ({
    from = DEFAULT_SOURCE,
    to = DEFAULT_TARGET,
    stagger = LETTER_STAGGER,
    travel = LETTER_TRAVEL,
  }) => {
    const a = Array.from(from);
    const b = Array.from(to);
    const { src } = mapLetters(a, b);
    const lastStart = SHUFFLE_AT + (a.length - 1) * stagger;
    const accentBase = lastStart + travel + ACCENT_GAP;

    const elements: TimelineElement<AnagramShuffleElementId>[] = [];
    a.forEach((ch, i) => {
      elements.push({
        id: `enter:${i}`,
        lane: "Enter",
        label: ch,
        start: i * ENTER_STAGGER,
        length: ENTER,
        follows: i > 0 ? `enter:${i - 1}` : undefined,
      });
    });
    a.forEach((ch, i) => {
      elements.push({
        id: `letter:${i}`,
        lane: "Shuffle",
        label: ch,
        start: SHUFFLE_AT + i * stagger,
        length: travel,
        follows: i > 0 ? `letter:${i - 1}` : `enter:${a.length - 1}`,
      });
    });
    b.forEach((ch, j) => {
      if (src[j] >= 0) return;
      elements.push({
        id: `arrive:${j}`,
        lane: "Shuffle",
        label: ch,
        start: lastStart,
        length: travel,
        // Arrivals start with the last letter, so they move with the one
        // before it.
        follows: a.length > 1 ? `letter:${a.length - 2}` : undefined,
        beats: { fade: travel * 0.4 },
      });
    });
    b.forEach((ch, j) => {
      elements.push({
        id: `accent:${j}`,
        lane: "Accent",
        label: ch,
        start: accentBase + j * ACCENT_STAGGER,
        length: ACCENT_LEN,
        follows:
          j > 0
            ? `accent:${j - 1}`
            : a.length > 0
              ? `letter:${a.length - 1}`
              : undefined,
      });
    });
    return elements.sort((x, y) => x.start - y.start);
  },
);
