import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The headline rises word by word and parts; a glow ignites in the gap,
// fills out into a card and recedes off it; the repository types into the
// field, the button is pressed and turns to done while the camera pushes in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type GlowBornCardElementId =
  | "before"
  | "settle"
  | "after"
  | "part"
  | "push"
  | "glow"
  | "recede"
  | "typing"
  | "press"
  | "done";

export interface GlowBornCardTimingProps {
  before?: string;
  after?: string;
  value?: string;
}

export const DEFAULT_BEFORE = "Or import a scene from";
export const DEFAULT_AFTER = "your repo";
export const DEFAULT_VALUE = "lumen-labs/launch";

const B = {
  words: -8,
  part: 18,
  ignite: 20,
  fill: 26,
  card: 32,
  recede: 34,
  recedeLen: 16,
  type: 60,
  press: 90,
  done: 96,
  end: 136,
};

/** Frames the demo runs, to the end of the camera's last push. */
export const CARD_END = B.end;

const WORD_STAGGER = 2;
const WORD = 14;
/** Typing pace: frames per character. */
const PER_CHAR = 1.5;

const wordsOf = (text: string) => text.split(" ");

// A headline half rises a word every `stagger` frames, each over `word`. The
// camera push runs from the part to the end, landing its first push at
// `land`. The glow ignites, fills and shows the card from its start; the
// recede fades the glow and the halo and lets the caret in. Typing runs one
// character every 1.5 frames, the field focusing `focusAt` before it and the
// meta line following `metaGap` after it.
export const glowBornCardTimeline = defineTimeline<
  GlowBornCardElementId,
  GlowBornCardTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    after = DEFAULT_AFTER,
    value = DEFAULT_VALUE,
  }): TimelineElement<GlowBornCardElementId>[] => [
    {
      id: "before",
      lane: "Headline",
      label: before,
      start: B.words,
      length: (wordsOf(before).length - 1) * WORD_STAGGER + WORD,
      beats: { stagger: WORD_STAGGER, word: WORD },
    },
    {
      id: "settle",
      lane: "Camera",
      label: "settle",
      start: -6,
      length: 30,
    },
    {
      id: "after",
      lane: "Headline",
      label: after,
      start: B.words + 10,
      length: (wordsOf(after).length - 1) * WORD_STAGGER + WORD,
      follows: "before",
      beats: { stagger: WORD_STAGGER, word: WORD },
    },
    {
      id: "part",
      lane: "Headline",
      label: "part",
      start: B.part,
      length: 18,
    },
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: B.part,
      length: B.end - B.part,
      beats: { land: B.done - B.part },
    },
    {
      id: "glow",
      lane: "Card",
      label: "glow",
      start: B.ignite,
      length: B.recede - B.ignite,
      follows: "part",
      beats: {
        ignite: 10,
        fillAt: B.fill - B.ignite,
        fill: 12,
        cardAt: B.card - B.ignite,
        card: 4,
      },
    },
    {
      id: "recede",
      lane: "Card",
      label: "recede",
      start: B.recede,
      length: B.recedeLen,
      follows: "glow",
      beats: {
        fadeAt: 8,
        fade: 16,
        haloAt: 4,
        halo: 12,
        haloOutAt: 16,
        haloOut: 20,
        caretAt: 10,
      },
    },
    {
      id: "typing",
      lane: "Field",
      label: value,
      start: B.type,
      length: value.length * PER_CHAR,
      follows: "recede",
      beats: { focusAt: -6, focus: 8, metaGap: 2, meta: 10 },
    },
    {
      id: "press",
      lane: "Button",
      label: "press",
      start: B.press,
      length: B.done - B.press,
      follows: "typing",
      beats: { release: 3, blurAt: 4, blur: 10 },
    },
    {
      id: "done",
      lane: "Button",
      label: "done",
      start: B.done,
      length: 5,
      follows: "press",
      beats: { checkAt: 1, check: 8 },
    },
  ],
);
