import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A slow push under the whole scene, each word landing and pushing its line
// out to the justified width, the highlight word filling with the gradient
// over its ember, the rule drawing and the logo rising. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type TaglineJustifyElementId =
  | "push"
  | `word:${number}`
  | "highlight"
  | "rule"
  | "logo";

export interface TaglineJustifyTimingProps {
  words?: string[];
  text?: string;
  stagger?: number;
}

export const DEFAULT_TEXT =
  "Your launch deserves a film as good as the product.";
const STAGGER = 6;
const FIRST = 6;

/** The words as set: `words` when given, else `text` split on spaces. */
export function taglineWords(words: string[] | undefined, text: string) {
  return words ?? text.trim().split(/\s+/);
}

// `word:<j>` is word `j` in reading order, a chain; it fades in over its
// length while its spring settles. The highlight's ember glows over its
// whole length, the gradient fills its word over `fill` frames from
// `fillAt`. The highlight, the rule and the logo follow the last word.
export const taglineJustifyTimeline = defineTimeline<
  TaglineJustifyElementId,
  TaglineJustifyTimingProps
>(({ words: wordsProp, text = DEFAULT_TEXT, stagger = STAGGER }) => {
  const words = taglineWords(wordsProp, text);
  const lastAt = FIRST + (words.length - 1) * stagger;
  // The outro follows the last word when that word lands before it.
  const lead = (at: number): TaglineJustifyElementId | undefined =>
    words.length > 0 && lastAt <= at ? `word:${words.length - 1}` : undefined;
  const elements: TimelineElement<TaglineJustifyElementId>[] = [
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: 0,
      length: 160,
    },
    ...words.map(
      (w, j): TimelineElement<TaglineJustifyElementId> => ({
        id: `word:${j}`,
        lane: "Words",
        label: w,
        start: FIRST + j * stagger,
        length: 6,
        follows: j > 0 ? `word:${j - 1}` : undefined,
      }),
    ),
    {
      id: "highlight",
      lane: "Highlight",
      label: "highlight",
      start: 78,
      length: 32,
      follows: lead(78),
      beats: { fillAt: 2, fill: 18 },
    },
    {
      id: "rule",
      lane: "Footer",
      label: "rule",
      start: 84,
      length: 24,
      follows: lead(84),
    },
    {
      id: "logo",
      lane: "Footer",
      label: "logo",
      start: 90,
      length: 22,
      follows: lead(90),
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
