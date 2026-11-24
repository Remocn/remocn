import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The eyebrow fades in and lifts, the name rises with its tracking closing
// up while a beam of light passes through it and a horizon glow rises, and
// the tagline rises word by word. The whole lockup settles from a slight
// push over the opening. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type IntroducingElementId =
  | "settle"
  | "eyebrow"
  | "name"
  | "glow"
  | "sweep"
  | `word:${number}`;

export interface IntroducingTimingProps {
  eyebrow?: string;
  name?: string;
  tagline?: string;
  pass?: number;
  stagger?: number;
}

export const DEFAULT_EYEBROW = "Introducing";
export const DEFAULT_NAME = "remocn";
export const DEFAULT_TAGLINE =
  "Launch-video scenes for Remotion. Copy, paste, render.";
export const DEFAULT_PASS = 44;
export const DEFAULT_STAGGER = 2;
const WORDS_AT = 56;
const WORD_RISE = 18;

/** The tagline's words. */
export function taglineWords(tagline: string) {
  return tagline.split(/\s+/).filter(Boolean);
}

// The eyebrow fades in over `in` and lifts from `lift` to `liftEnd`. The
// name rises over `rise` while its tracking closes over its whole length.
// The beam crosses the name in `pass` frames. The words are a chain.
export const introducingTimeline = defineTimeline<
  IntroducingElementId,
  IntroducingTimingProps
>(
  ({
    eyebrow = DEFAULT_EYEBROW,
    name = DEFAULT_NAME,
    tagline = DEFAULT_TAGLINE,
    pass = DEFAULT_PASS,
    stagger = DEFAULT_STAGGER,
  }) => {
    const elements: TimelineElement<IntroducingElementId>[] = [
      {
        id: "settle",
        lane: "Camera",
        label: "Settle",
        start: 0,
        length: 100,
      },
      {
        id: "eyebrow",
        lane: "Eyebrow",
        label: eyebrow,
        start: 0,
        length: 32,
        beats: { in: 18, lift: 12, liftEnd: 32 },
      },
      {
        id: "name",
        lane: "Name",
        label: name,
        start: 24,
        length: 44,
        beats: { rise: 24 },
      },
      {
        id: "glow",
        lane: "Glow",
        label: "Horizon glow",
        start: 26,
        length: 54,
      },
      {
        id: "sweep",
        lane: "Name",
        label: "Beam pass",
        start: 34,
        length: pass,
      },
    ];
    taglineWords(tagline).forEach((word, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Tagline",
        label: word,
        start: WORDS_AT + i * stagger,
        length: WORD_RISE,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      });
    });
    return elements;
  },
);
