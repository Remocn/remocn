import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The point fading in, its one breath, its glide to the start of the line,
// each word it writes, the mask opening once it lands as the full stop, and
// the subline. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type PointIntroElementId =
  | "dot"
  | "breathe"
  | "glide"
  | `word:${number}`
  | "open"
  | "subline";

export interface PointIntroTimingProps {
  title?: string;
  stagger?: number;
}

export const DEFAULT_TITLE = "Introducing remocn 2.0";
/** Frames between words as the point writes them, by default. */
export const WORD_STAGGER = 13;

/** The headline's words, as the component draws them. */
export const wordsOf = (title: string) => title.split(/\s+/).filter(Boolean);

const DOT_IN = 0;
const DOT_IN_LEN = 14;
const BREATHE = 14;
const BREATHE_LEN = 30;
const GLIDE = 46;
const GLIDE_LEN = 26;
const WRITE = 66;
const WORD_LEN = 26;
const DOT_STEP = 18;
const OPEN_LEAD = 4;
const OPEN_LEN = 12;
const SUB_GAP = 10;
const SUB_LEN = 30;

// A word's `step` beat is how long the point takes to move past it. The
// open's `land` beat is when the point lands as the full stop; the point
// shrinks from its solo size between the glide's start and that moment.
// The words form a chain after the glide; the open follows the last word and
// the subline follows the open.
export const pointIntroTimeline = defineTimeline<
  PointIntroElementId,
  PointIntroTimingProps
>(({ title = DEFAULT_TITLE, stagger = WORD_STAGGER }) => {
  const words = wordsOf(title);
  const lastLand = WRITE + (words.length - 1) * stagger + DOT_STEP;
  const elements: TimelineElement<PointIntroElementId>[] = [
    {
      id: "dot",
      lane: "Point",
      label: "in",
      start: DOT_IN,
      length: DOT_IN_LEN,
    },
    {
      id: "breathe",
      lane: "Point",
      label: "breath",
      start: BREATHE,
      length: BREATHE_LEN,
      follows: "dot",
    },
    {
      id: "glide",
      lane: "Point",
      label: "glide",
      start: GLIDE,
      length: GLIDE_LEN,
      follows: "breathe",
    },
  ];
  words.forEach((word, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Words",
      label: word,
      start: WRITE + i * stagger,
      length: WORD_LEN,
      follows: i > 0 ? `word:${i - 1}` : "glide",
      beats: { step: DOT_STEP },
    });
  });
  elements.push(
    {
      id: "open",
      lane: "Point",
      label: "full stop",
      start: lastLand - OPEN_LEAD,
      length: OPEN_LEN,
      follows: words.length > 0 ? `word:${words.length - 1}` : "glide",
      beats: { land: OPEN_LEAD },
    },
    {
      id: "subline",
      lane: "Subline",
      label: "subline",
      start: lastLand + SUB_GAP,
      length: SUB_LEN,
      follows: "open",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
