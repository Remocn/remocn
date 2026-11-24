import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Noisy traces jitter on the scope, a sweep resolves them into one sine, the
// sine flattens and rises, the line reels into the R and traces it, the R
// fills, shrinks into the logo and the name slides out of it, then the
// caption fades up word by word. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type SignalResolveElementId =
  | "noise"
  | "sweep"
  | "flatten"
  | "reel"
  | "fill"
  | "lockup"
  | "name"
  | `word:${number}`;

export interface SignalResolveTimingProps {
  caption?: string;
  stagger?: number;
}

export const DEFAULT_CAPTION = "Less noise. More signal.";
const STAGGER = 3;

/** The caption's words; the last sentence is set in the serif. */
export function captionWords(caption: string) {
  const sentences = caption.split(/(?<=[.!?…])\s+/);
  const words: { w: string; serif: boolean }[] = [];
  sentences.forEach((sentence, si) => {
    for (const w of sentence.split(" ")) {
      words.push({
        w,
        serif: sentences.length > 1 && si === sentences.length - 1,
      });
    }
  });
  return words;
}

// The scope: the graticule fades in over `gridIn` while the traces jitter;
// the sweep's marker fades in and out on its beats and the signal counts as
// resolved at `lock`; the flatten lowers the sine from `flat` to `flatEnd`
// while the line rises over its length and the graticule fades between
// `gridOut` and `gridOutEnd`. The reel retracts the far end by `retract`
// and reels in the lead between `tail` and `tailEnd` while the outline
// traces over its length. The name slides out over its length and unclips
// between `clip` and `clipEnd`. Caption words are a chain.
export const signalResolveTimeline = defineTimeline<
  SignalResolveElementId,
  SignalResolveTimingProps
>(({ caption = DEFAULT_CAPTION, stagger = STAGGER }) => {
  const elements: TimelineElement<SignalResolveElementId>[] = [
    {
      id: "noise",
      lane: "Scope",
      label: "Noisy traces",
      start: 0,
      length: 16,
      beats: { gridIn: 12 },
    },
    {
      id: "sweep",
      lane: "Scope",
      label: "Sweep resolves",
      start: 16,
      length: 58,
      follows: "noise",
      beats: { fadeIn: 8, fadeOut: 48, lock: 60 },
    },
    {
      id: "flatten",
      lane: "Scope",
      label: "Sine flattens",
      start: 88,
      length: 24,
      follows: "sweep",
      beats: { flat: 2, flatEnd: 22, gridOut: 4, gridOutEnd: 28 },
    },
    {
      id: "reel",
      lane: "Logo",
      label: "Line traces the R",
      start: 110,
      length: 42,
      follows: "flatten",
      beats: { retract: 18, tail: 2, tailEnd: 40 },
    },
    {
      id: "fill",
      lane: "Logo",
      label: "R fills",
      start: 148,
      length: 18,
      follows: "reel",
    },
    {
      id: "lockup",
      lane: "Logo",
      label: "R shrinks into the logo",
      start: 160,
      length: 28,
      follows: "fill",
    },
    {
      id: "name",
      lane: "Logo",
      label: "Name slides out",
      start: 176,
      length: 28,
      follows: "lockup",
      beats: { clip: 3, clipEnd: 32 },
    },
  ];
  captionWords(caption).forEach(({ w }, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Caption",
      label: w,
      start: 198 + i * stagger,
      length: 20,
      follows: i > 0 ? `word:${i - 1}` : "name",
    });
  });
  return elements;
});
