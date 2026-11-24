import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The words typing into the sticker one by one, the caret fading once the
// last word lands, then the sticker cycling from fill to outline to clear and
// back to fill with a pop. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type StoryTextElementId =
  | `word:${number}`
  | "push"
  | "caret"
  | "outline"
  | "clear"
  | "fill";

export interface StoryTextTimingProps {
  text?: string;
  /** Frames between words as they type in. */
  stagger?: number;
  /** Frames the typed text holds before the sticker styles cycle. */
  hold?: number;
}

export const DEFAULT_TEXT =
  "okay, it’s live — the update you kept asking for is finally here";
const FIRST_WORD = -2;
export const WORD_GAP = 5;
const WORD_IN = 8;
const HOLD = 14;
/** Frames between one sticker style and the next. */
const STYLE_GAP = 22;
/** Frames one sticker style takes to blend in. */
const STYLE_IN = 9;

/** The text as words, split on whitespace. */
export function storyWords(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

// `word:<i>` springs in at its start and inks in from `ink` to two frames
// past its end; the list is a chain. `caret` starts when the last word has
// landed and fades from `fadeAt` to `fadeEnd`. `outline`, `clear` and
// `fill` each blend the sticker into the next style; `fill` also pops the
// sticker. `push` is the slow push on the ground.
export const storyTextTimeline = defineTimeline<
  StoryTextElementId,
  StoryTextTimingProps
>(({ text = DEFAULT_TEXT, stagger = WORD_GAP, hold = HOLD }) => {
  const words = storyWords(text);
  const elements: TimelineElement<StoryTextElementId>[] = words.map(
    (word, i) => ({
      id: `word:${i}`,
      lane: "Words",
      label: word,
      start: FIRST_WORD + i * stagger,
      length: WORD_IN,
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats: { ink: 2 },
    }),
  );
  elements.push({
    id: "push",
    lane: "Ground",
    label: "push",
    start: 0,
    length: 200,
  });
  const typedEnd = FIRST_WORD + (words.length - 1) * stagger + WORD_IN;
  const last = words.length ? (`word:${words.length - 1}` as const) : undefined;
  const C1 = typedEnd + hold;
  const C2 = C1 + STYLE_GAP;
  const C3 = C2 + STYLE_GAP;
  elements.push(
    {
      id: "caret",
      lane: "Caret",
      label: "caret",
      start: typedEnd,
      length: 6,
      follows: last,
      beats: { fadeAt: -2, fadeEnd: 6 },
    },
    {
      id: "outline",
      lane: "Sticker",
      label: "outline",
      start: C1,
      length: STYLE_IN,
      follows: last,
    },
    {
      id: "clear",
      lane: "Sticker",
      label: "clear",
      start: C2,
      length: STYLE_IN,
      follows: "outline",
    },
    {
      id: "fill",
      lane: "Sticker",
      label: "fill",
      start: C3,
      length: STYLE_IN,
      follows: "clear",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
