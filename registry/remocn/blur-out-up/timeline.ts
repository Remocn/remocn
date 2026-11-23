import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each word comes into focus and when it blurs out upward. Frames on the 30 fps
// scene timeline, after `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type BlurOutUpElementId = `word:${number}` | `exit:${number}`;

export interface BlurOutUpTimingProps {
  text: string;
  staggerDelay?: number;
}

/** A word fades in over `ENTER`, travelling for the first `ENTER_TRAVEL`. */
const ENTER = 17;
const ENTER_TRAVEL = 6;
/** A word fades out over `EXIT`, travelling from `EXIT_TRAVEL_FROM` on. */
const EXIT = 14;
const EXIT_TRAVEL_FROM = 8;
const STAGGER = 1;

// The exit is timed to end with the scene. `length` here is the composition
// length in scene frames without `speed`, as the component has always read
// it, so a faster scene still leaves at the end of the composition's frames.
export const blurOutUpTimeline = defineTimeline<
  BlurOutUpElementId,
  BlurOutUpTimingProps
>(({ text, staggerDelay = STAGGER }, { length }) => {
  const words = text.split(" ");
  const enterEnd = ENTER + (words.length - 1) * staggerDelay;
  const exitStart = Math.max(
    enterEnd,
    length - EXIT - (words.length - 1) * staggerDelay,
  );
  return [
    ...words.map(
      (item, i): TimelineElement<BlurOutUpElementId> => ({
        id: `word:${i}`,
        lane: "In",
        label: item,
        start: i * staggerDelay,
        length: ENTER,
        follows: i > 0 ? `word:${i - 1}` : undefined,
        beats: { travel: ENTER_TRAVEL },
      }),
    ),
    ...words.map(
      (item, i): TimelineElement<BlurOutUpElementId> => ({
        id: `exit:${i}`,
        lane: "Out",
        label: item,
        start: exitStart + i * staggerDelay,
        length: EXIT,
        follows: i > 0 ? `exit:${i - 1}` : `word:${words.length - 1}`,
        beats: { travelFrom: EXIT_TRAVEL_FROM },
      }),
    ),
  ];
});
