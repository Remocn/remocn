import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The sentence rising in as one line, the gaps between its words opening,
// and each word dropping into the stack. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type ChunkStackElementId = "rise" | "open" | `drop:${number}`;

export interface ChunkStackTimingProps {
  text?: string;
  stagger?: number;
}

export const DEFAULT_TEXT = "learn motion by making it";
/** Frames between words as they drop, by default. */
export const DROP_GAP = 4;

/** The words of the sentence, as the component draws them. */
export const wordsOf = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean);

const RISE_LEN = 16;
const OPEN_AT = 26;
const OPEN_GAP = 3;
const OPEN_LEN = 14;
const DROP_AT = 50;
/** The words start falling 2 frames apart, whatever the stagger. */
const FALL_GAP = 2;
const FALL_LEN = 12;
const SLIDE_AT = 6;
const DROP_LEN = 22;

// The open's `gap` beat is the time between two gaps opening and `each` how
// long one gap takes. A drop starts at its slide's slot: `fall` (possibly
// negative) is when the word starts falling, `slide` when it starts across,
// `land` when it lands and bounces; the highlight pill grows from `pill` to
// `pillEnd` and the word turns from `ink` to `inkEnd`. Each drop follows the
// one before; the first follows the open, the open follows the rise.
export const chunkStackTimeline = defineTimeline<
  ChunkStackElementId,
  ChunkStackTimingProps
>(({ text = DEFAULT_TEXT, stagger = DROP_GAP }) => {
  const words = wordsOf(text);
  const n = words.length;
  const elements: TimelineElement<ChunkStackElementId>[] = [
    { id: "rise", lane: "Line", label: "rise", start: 0, length: RISE_LEN },
    {
      id: "open",
      lane: "Line",
      label: "open gaps",
      start: OPEN_AT,
      length: (n - 2) * OPEN_GAP + OPEN_LEN,
      follows: "rise",
      beats: { gap: OPEN_GAP, each: OPEN_LEN },
    },
  ];
  words.forEach((word, k) => {
    elements.push({
      id: `drop:${k}`,
      lane: "Stack",
      label: word,
      start: DROP_AT + k * stagger,
      length: DROP_LEN,
      follows: k > 0 ? `drop:${k - 1}` : "open",
      beats: {
        fall: k * FALL_GAP - k * stagger,
        fallLen: FALL_LEN,
        slide: SLIDE_AT,
        land: DROP_LEN,
        pill: DROP_LEN - 2,
        pillEnd: DROP_LEN + 10,
        ink: DROP_LEN - 1,
        inkEnd: DROP_LEN + 6,
      },
    });
  });
  return elements;
});
