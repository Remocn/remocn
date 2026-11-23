import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each word of the old line leaves and each word of the new one
// arrives. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type PerWordCrossfadeElementId = `out:${number}` | `in:${number}`;

export interface PerWordCrossfadeTimingProps {
  fromText: string;
  toText: string;
}

/** An old word fades over `EXIT`, lifting from `EXIT_TRAVEL_FROM` on. */
const EXIT = 15;
const EXIT_TRAVEL_FROM = 6;
const EXIT_STAGGER = 1;
/** A new word fades over `ENTER`, settling in its first `ENTER_TRAVEL`. */
const ENTER = 21;
const ENTER_TRAVEL = 5;
const ENTER_STAGGER = 2;
/** The new line starts this much before the old one has left... */
const OVERLAP = 5;
/** ...less this breath. */
const MICRO_DELAY = 2;

export const perWordCrossfadeTimeline = defineTimeline<
  PerWordCrossfadeElementId,
  PerWordCrossfadeTimingProps
>(({ fromText, toText }) => {
  const fromWords = fromText.split(" ");
  const toWords = toText.split(" ");
  const exitTotal = EXIT + (fromWords.length - 1) * EXIT_STAGGER;
  const newStart = Math.max(0, exitTotal - OVERLAP + MICRO_DELAY);
  const lastOut: PerWordCrossfadeElementId = `out:${fromWords.length - 1}`;
  return [
    ...fromWords.map(
      (word, i): TimelineElement<PerWordCrossfadeElementId> => ({
        id: `out:${i}`,
        lane: "Out",
        label: word,
        start: i * EXIT_STAGGER,
        length: EXIT,
        follows: i > 0 ? `out:${i - 1}` : undefined,
        beats: { travelFrom: EXIT_TRAVEL_FROM },
      }),
    ),
    ...toWords.map(
      (word, j): TimelineElement<PerWordCrossfadeElementId> => ({
        id: `in:${j}`,
        lane: "In",
        label: word,
        start: newStart + j * ENTER_STAGGER,
        length: ENTER,
        follows: j > 0 ? `in:${j - 1}` : lastOut,
        beats: { travel: ENTER_TRAVEL },
      }),
    ),
  ];
});
