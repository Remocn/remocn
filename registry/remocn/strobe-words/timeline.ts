import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Strobe cuts through the words, each a field of its own, to the poster with
// the last word and the logo. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type StrobeWordsElementId = `cut:${number}` | "poster";

export interface StrobeWordsTimingProps {
  words?: string[];
  rhythm?: number[];
  beat?: number;
  cuts?: number;
}

export const DEFAULT_WORDS = ["Plan.", "Write.", "Render.", "Ship."];
const BEAT = 6;
const CUTS = 13;
/** The poster's glow rises over this many frames. */
const POSTER_RISE = 60;

/** The words shown, a fallback when there are none. */
export function listOf(words: string[]) {
  return words.length > 0 ? words : ["Ship."];
}

function defaultRhythm(count: number, beat: number, cuts: number) {
  let n = count - 1;
  while (n < cuts) n += count;
  return Array.from({ length: n }, (_, i) =>
    Math.round(beat - ((beat / 2) * i) / Math.max(1, n - 1)),
  );
}

/** The word on cut `index` of `cuts`: the cuts end on the word before the last. */
export function cutWord(list: string[], index: number, cuts: number) {
  return list[
    (((index - cuts + list.length - 1) % list.length) + list.length) %
      list.length
  ];
}

// `cut:<i>` holds until the next cut; the poster follows the last cut and
// holds to the end, its glow rising over its length.
export const strobeWordsTimeline = defineTimeline<
  StrobeWordsElementId,
  StrobeWordsTimingProps
>(({ words = DEFAULT_WORDS, rhythm, beat = BEAT, cuts = CUTS }) => {
  const list = listOf(words);
  const beats =
    rhythm && rhythm.length > 0
      ? rhythm
      : defaultRhythm(list.length, beat, cuts);
  const elements: TimelineElement<StrobeWordsElementId>[] = [];
  let at = 0;
  for (let i = 0; i < beats.length; i++) {
    elements.push({
      id: `cut:${i}`,
      lane: "Cuts",
      label: cutWord(list, i, beats.length),
      start: at,
      length: beats[i],
      follows: i > 0 ? `cut:${i - 1}` : undefined,
    });
    at += beats[i];
  }
  elements.push({
    id: "poster",
    lane: "Poster",
    label: list[list.length - 1],
    start: at,
    length: POSTER_RISE,
    follows: beats.length > 0 ? `cut:${beats.length - 1}` : undefined,
  });
  return elements;
});
