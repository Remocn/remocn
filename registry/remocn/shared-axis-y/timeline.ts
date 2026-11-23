import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each word of the old line cuts out and each word of the new one cuts
// in. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type SharedAxisYElementId = `out:${number}` | `in:${number}`;

export interface SharedAxisYTimingProps {
  fromText: string;
  toText: string;
}

/** An old word holds for `EXIT` frames, then cuts out. */
const EXIT = 4;
const EXIT_STAGGER = 2;
/** A new word cuts in `ENTER` frames after its start. */
const ENTER = 5;
const ENTER_STAGGER = 2;
const OVERLAP = 0;
const MICRO_DELAY = 1;

export const sharedAxisYTimeline = defineTimeline<
  SharedAxisYElementId,
  SharedAxisYTimingProps
>(({ fromText, toText }) => {
  const fromWords = fromText.split(" ");
  const toWords = toText.split(" ");
  const exitTotal = EXIT + (fromWords.length - 1) * EXIT_STAGGER;
  const newStart = Math.max(0, exitTotal - OVERLAP + MICRO_DELAY);
  const lastOut: SharedAxisYElementId = `out:${fromWords.length - 1}`;
  return [
    ...fromWords.map(
      (word, i): TimelineElement<SharedAxisYElementId> => ({
        id: `out:${i}`,
        lane: "Out",
        label: word,
        start: i * EXIT_STAGGER,
        length: EXIT,
        follows: i > 0 ? `out:${i - 1}` : undefined,
      }),
    ),
    ...toWords.map(
      (word, j): TimelineElement<SharedAxisYElementId> => ({
        id: `in:${j}`,
        lane: "In",
        label: word,
        start: newStart + j * ENTER_STAGGER,
        length: ENTER,
        follows: j > 0 ? `in:${j - 1}` : lastOut,
      }),
    ),
  ];
});
