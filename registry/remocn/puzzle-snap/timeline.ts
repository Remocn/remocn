import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pieces drift in one after another and snap into the mark with a spark,
// then the mark punches and slides over as the wordmark wipes in. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type PuzzleSnapElementId = `piece:${number}` | "lockup";

export interface PuzzleSnapTimingProps {
  square?: boolean;
}

const PIECES = ["Quarter", "Dot", "Wedge", "Square"];
const STAGGER = 3;
const DRIFT = 10;
const SNAP = 3;
const SPARK = 8;
const FADE = 3;
const SLIDE = 11;

// A piece drifts in over `drift`, snaps over `snap` and sparks over `spark`.
// The lockup starts at the last piece's contact: the mark punches, slides
// over from `slide` and the wordmark wipes in from `reveal`.
export const puzzleSnapTimeline = defineTimeline<
  PuzzleSnapElementId,
  PuzzleSnapTimingProps
>(({ square = true }) => {
  const count = square ? 4 : 3;
  const elements: TimelineElement<PuzzleSnapElementId>[] = PIECES.slice(
    0,
    count,
  ).map((label, i) => ({
    id: `piece:${i}`,
    lane: "Pieces",
    label,
    start: i * STAGGER,
    length: DRIFT + SNAP + SPARK,
    follows: i > 0 ? `piece:${i - 1}` : undefined,
    beats: { fade: FADE, drift: DRIFT, snap: SNAP, spark: SPARK },
  }));
  elements.push({
    id: "lockup",
    lane: "Lockup",
    label: "Mark punches, wordmark slides in",
    start: (count - 1) * STAGGER + DRIFT + SNAP,
    length: 4 + SLIDE,
    follows: `piece:${count - 1}`,
    beats: { slide: 2, slideLength: SLIDE, reveal: 4, revealLength: SLIDE },
  });
  return elements;
});
