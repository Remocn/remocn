import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line typing out, then splitting apart: the prefix wipes away, the
// anchor closes from both sides, the suffix words wipe off one by one.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type TypedSplitWipeElementId =
  | "type"
  | "exit"
  | "anchor"
  | `word:${number}`;

export interface TypedSplitWipeTimingProps {
  prefix: string;
  anchor: string;
  suffix: string;
  typeFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  wordStagger?: number;
}

const TYPE_FRAMES = 30;
const EXIT_AT = 50;
const EXIT_FRAMES = 20;
const WORD_STAGGER = 4;
/** The anchor closes over the last `ANCHOR_FRAMES` of the prefix wipe. */
const ANCHOR_FRAMES = 6;
/** The first suffix word starts wiping this long after the prefix. */
const WORD_LAG = 2;
/** A suffix word wipes off in this share of the prefix wipe. */
const WORD_SHARE = 0.65;

// `exit` is the moment the line splits: the prefix wipes over its length.
export const typedSplitWipeTimeline = defineTimeline<
  TypedSplitWipeElementId,
  TypedSplitWipeTimingProps
>(
  ({
    prefix,
    anchor,
    suffix,
    typeFrames = TYPE_FRAMES,
    exitAt = EXIT_AT,
    exitFrames = EXIT_FRAMES,
    wordStagger = WORD_STAGGER,
  }) => {
    const safeExitFrames = Math.max(exitFrames, 0.001);
    const elements: TimelineElement<TypedSplitWipeElementId>[] = [
      {
        id: "type",
        lane: "Type",
        label: [prefix, anchor, suffix].filter(Boolean).join(" "),
        start: 0,
        length: Math.max(typeFrames, 0.001),
      },
      {
        id: "exit",
        lane: "Prefix",
        label: prefix,
        start: exitAt,
        length: safeExitFrames,
        follows: "type",
      },
      {
        id: "anchor",
        lane: "Anchor",
        label: anchor,
        start: exitAt + Math.max(exitFrames - ANCHOR_FRAMES, 0),
        length: ANCHOR_FRAMES,
        follows: "exit",
      },
      ...suffix
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (word, index): TimelineElement<TypedSplitWipeElementId> => ({
            id: `word:${index}`,
            lane: "Suffix",
            label: word,
            start: exitAt + WORD_LAG + index * wordStagger,
            length: safeExitFrames * WORD_SHARE,
            follows: index > 0 ? `word:${index - 1}` : "exit",
          }),
        ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
