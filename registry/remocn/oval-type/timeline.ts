import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The conveyor stepping one capsule left per beat, each step landing with a
// bounce, then the passed capsules clearing out while the tagline capsules
// grow, one after another, into the tall poster ovals. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type OvalTypeElementId = `step:${number}` | "clear" | `grow:${number}`;

export interface OvalTypeTimingProps {
  tagline?: string[];
  words?: string[];
  /** Frames between two conveyor steps. */
  beat?: number;
  /** Frames the tagline takes to grow into the tall poster ovals. */
  landLen?: number;
}

export const DEFAULT_TAGLINE = ["Make", "it", "move"];
export const DEFAULT_WORDS = ["Plan", "Cut", "Edit", "Loop", "Sync", "Draft"];
const BEAT = 9;
const FIRST_STEP = 6;
const MOVE = 7;
export const LAND_LEN = 18;
/** Frames a landing bounce rings for, and its decay. */
const BOUNCE = 12;
const DECAY = 4;

// Step `j` moves the row one slot: it takes `MOVE` frames, then rings for
// its `bounce` beat. The poster follows the last step: the passed capsules
// clear and each tagline capsule grows 2 frames after the one before.
export const ovalTypeTimeline = defineTimeline<
  OvalTypeElementId,
  OvalTypeTimingProps
>(
  ({
    tagline = DEFAULT_TAGLINE,
    words = DEFAULT_WORDS,
    beat = BEAT,
    landLen = LAND_LEN,
  }) => {
    const row = tagline.length > 0 ? tagline : ["Make"];
    const m = words.length;
    const lastEnd = FIRST_STEP + (m - 1) * beat + MOVE;
    const posterAt = lastEnd + 2;
    const lastStep: OvalTypeElementId | undefined =
      m > 0 ? `step:${m - 1}` : undefined;

    const elements: TimelineElement<OvalTypeElementId>[] = words.map(
      (word, j) => ({
        id: `step:${j}`,
        lane: "Conveyor",
        label: word,
        start: FIRST_STEP + j * beat,
        length: MOVE,
        follows: j > 0 ? `step:${j - 1}` : undefined,
        beats: { bounce: BOUNCE, decay: DECAY },
      }),
    );
    elements.push({
      id: "clear",
      lane: "Clear",
      label: "clear",
      start: posterAt,
      length: landLen,
      follows: lastStep,
    });
    row.forEach((word, i) => {
      elements.push({
        id: `grow:${i}`,
        lane: "Poster",
        label: word,
        start: posterAt + Math.max(0, i) * 2,
        length: landLen,
        follows: i > 0 ? `grow:${i - 1}` : lastStep,
      });
    });
    return elements;
  },
);
