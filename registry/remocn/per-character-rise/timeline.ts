import { defineTimeline } from "@/lib/remocn/timeline";

// When each letter rises in. Frames on the 30 fps scene timeline, after
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PerCharacterRiseElementId = `char:${number}`;

export interface PerCharacterRiseTimingProps {
  text: string;
}

/** Frames between one letter and the next. */
const STAGGER = 1;
/** Frames a letter takes to fade in; it travels for the first `travel`. */
const FADE = 21;
const TRAVEL = 10;

export const perCharacterRiseTimeline = defineTimeline<
  PerCharacterRiseElementId,
  PerCharacterRiseTimingProps
>(({ text }) =>
  Array.from(text).map((char, i) => ({
    id: `char:${i}`,
    lane: "Letters",
    label: char,
    start: i * STAGGER,
    length: FADE,
    follows: i > 0 ? `char:${i - 1}` : undefined,
    beats: { travel: TRAVEL },
  })),
);
