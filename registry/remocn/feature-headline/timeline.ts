import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pill opening, each headline word rising out of its mask, and the
// subhead rising and sharpening. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The exit stays pinned to the last frames of the
// composition and is not part of the schedule. The ids are public: a saved
// `timing` prop refers to them.

export type FeatureHeadlineElementId = "pill" | `word:${number}` | "subhead";

export interface FeatureHeadlineTimingProps {
  headline?: string;
  /** Frames between headline words rising. */
  stagger?: number;
}

export const DEFAULT_HEADLINE = "Captions that move with every word.";
export const DEFAULT_STAGGER = 2;

const PILL = 14;
const WORDS_AT = 4;
const RISE = 16;
const SUB_AT = 12;
/** The subhead waits 1.5 frames per word, for up to `SUB_WORDS` words. */
const SUB_WORDS = 8;
const SUB_PER_WORD = 1.5;
const SUB = 18;

// `pill` opens over its length. `word:<i>` rises headline word `i` over its
// length, each following the one before. `subhead` rises over its length,
// following the pill.
export const featureHeadlineTimeline = defineTimeline<
  FeatureHeadlineElementId,
  FeatureHeadlineTimingProps
>(({ headline = DEFAULT_HEADLINE, stagger = DEFAULT_STAGGER }) => {
  const words = headline.match(/\S+/g) ?? [];
  const subStart = SUB_AT + Math.min(words.length, SUB_WORDS) * SUB_PER_WORD;
  const elements: TimelineElement<FeatureHeadlineElementId>[] = [
    { id: "pill", lane: "Pill", label: "pill", start: 0, length: PILL },
    ...words.map(
      (w, i): TimelineElement<FeatureHeadlineElementId> => ({
        id: `word:${i}`,
        lane: "Headline",
        label: w,
        start: WORDS_AT + i * stagger,
        length: RISE,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    ),
    {
      id: "subhead",
      lane: "Subhead",
      label: "subhead",
      start: subStart,
      length: SUB,
      follows: "pill",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
