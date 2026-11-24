import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter comes out of the blur. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type SoftBlurInElementId = `char:${number}`;

export interface SoftBlurInTimingProps {
  text: string;
}

const STAGGER = 1;
/** Frames a letter takes to come in. */
const LENGTH = 27;
const TRAVEL = 9;

export const softBlurInTimeline = defineTimeline<
  SoftBlurInElementId,
  SoftBlurInTimingProps
>(({ text }) =>
  Array.from(text).map((item, i) => ({
    id: `char:${i}`,
    lane: "Letters",
    label: item,
    start: i * STAGGER,
    length: LENGTH,
    follows: i > 0 ? `char:${i - 1}` : undefined,
    beats: { travel: TRAVEL },
  })),
);
