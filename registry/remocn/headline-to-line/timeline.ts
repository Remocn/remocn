import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The headline enters word by word, the accent word pops, the ground rises,
// the headline shrinks into the start of a line and the rest of the line is
// typed after it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type HeadlineToLineElementId =
  | `word:${number}`
  | "pop"
  | "rise"
  | "shrink"
  | "type";

export interface HeadlineToLineTimingProps {
  words?: string[];
  accentIndex?: number;
  continuation?: string;
  stagger?: number;
  charsPerFrame?: number;
}

export const DEFAULT_WORDS = ["Your", "launch", "video"];
export const DEFAULT_CONTINUATION = ", built from blocks you own";
export const WORD_STEP = 6;
export const CHARS_PER_FRAME = 1;
const WORD_LEAD = -4;
const ENTER = 12;
const POP = 24;
const TINT = 6;
const RISE = 42;
const RISE_LEN = 42;
const SHRINK = 48;
const SHRINK_LEN = 18;
const WORD_LAG = 1;
const CARET_IN = 6;
const TYPE = 66;
const BLINK_AFTER = 6;
const BLINK = 15;

// `word:<i>` enters over its length; the words form a chain. `pop` pops and
// tints the accent word. `rise` lifts the ground. `shrink` carries the words
// into the line, each over `move` frames, `lag` apart (three times that when
// the headline wraps, which is measured); the caret fades in over `caretIn`
// frames before the last word lands. `type` types the continuation at
// `charsPerFrame` (slowed by its `pace` beat); the caret starts blinking
// `blinkAfter` frames after the typing ends, `blink` frames on and off.
export const headlineToLineTimeline = defineTimeline<
  HeadlineToLineElementId,
  HeadlineToLineTimingProps
>(
  ({
    words = DEFAULT_WORDS,
    accentIndex = 1,
    continuation = DEFAULT_CONTINUATION,
    stagger = WORD_STEP,
    charsPerFrame = CHARS_PER_FRAME,
  }): TimelineElement<HeadlineToLineElementId>[] => {
    const n = words.length;
    const validAccent = accentIndex >= 0 && accentIndex < n;
    const elements: TimelineElement<HeadlineToLineElementId>[] = words.map(
      (word, i) => ({
        id: `word:${i}`,
        lane: "Headline",
        label: word,
        start: i * stagger + WORD_LEAD,
        length: ENTER,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    if (validAccent) {
      elements.push({
        id: "pop",
        lane: "Accent",
        label: words[accentIndex],
        start: POP,
        length: TINT,
        follows: `word:${accentIndex}`,
      });
    }
    // Landing when the headline sits on one line.
    const landed = SHRINK + SHRINK_LEN + Math.max(0, n - 1) * WORD_LAG;
    elements.push(
      {
        id: "rise",
        lane: "Ground",
        label: "ground rises",
        start: RISE,
        length: RISE_LEN,
      },
      {
        id: "shrink",
        lane: "Headline",
        label: "shrink into the line",
        start: SHRINK,
        length: landed - SHRINK,
        follows: validAccent ? "pop" : undefined,
        beats: { move: SHRINK_LEN, lag: WORD_LAG, caretIn: CARET_IN },
      },
      {
        id: "type",
        lane: "Line",
        label: continuation,
        start: Math.max(TYPE, landed),
        length: Math.ceil(continuation.length / charsPerFrame),
        follows: "shrink",
        beats: { pace: 1, blinkAfter: BLINK_AFTER, blink: BLINK },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
