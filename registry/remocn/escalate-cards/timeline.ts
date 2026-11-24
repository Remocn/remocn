import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Hard cuts from card to card, each shorter than the one before, to the
// climax card that holds and pushes in, with the date cutting in under it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type EscalateCardsElementId = `card:${number}` | "date";

export interface EscalateCardsTimingProps {
  words?: string[];
  date?: string;
  /** Length of the first card in frames. Every next card is shorter. */
  firstBeat?: number;
  /** Each card lasts this share of the one before. */
  accel?: number;
  /** Frames after the last cut before the date cuts in. */
  dateDelay?: number;
}

export const DEFAULT_WORDS = ["ONE", "CODEBASE", "EVERY", "LAUNCH"];
export const DEFAULT_DATE = "OCTOBER 30";
const FIRST_BEAT = 26;
const ACCEL = 0.6;
const DATE_DELAY = 14;
/** The climax settles its push over this many frames. */
const SETTLE = 80;

// A card holds until the next cut. The climax runs until the date cuts in
// (or to the end without one), settles over its `settle` beat and holds.
export const escalateCardsTimeline = defineTimeline<
  EscalateCardsElementId,
  EscalateCardsTimingProps
>(
  (
    {
      words = DEFAULT_WORDS,
      date = DEFAULT_DATE,
      firstBeat = FIRST_BEAT,
      accel = ACCEL,
      dateDelay = DATE_DELAY,
    },
    { length },
  ) => {
    const last = Math.max(1, words.length) - 1;
    const withDate = date !== "" && words.length > 0;
    const elements: TimelineElement<EscalateCardsElementId>[] = [];
    let start = 0;
    words.forEach((word, i) => {
      const climax = i === last;
      const cardLength = !climax
        ? Math.max(4, Math.round(firstBeat * accel ** i))
        : withDate
          ? dateDelay
          : Math.max(0, length - start);
      elements.push({
        id: `card:${i}`,
        lane: "Cards",
        label: word,
        start,
        length: cardLength,
        follows: i > 0 ? `card:${i - 1}` : undefined,
        beats: climax ? { settle: SETTLE } : undefined,
      });
      start += cardLength;
    });
    if (withDate) {
      elements.push({
        id: "date",
        lane: "Date",
        label: date,
        start,
        length: Math.max(0, length - start),
        follows: `card:${last}`,
      });
    }
    return elements;
  },
);
