import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word refitting to the frame letter by letter, then the caption and
// the logo rising in under the last word. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type EdgeFitElementId = `word:${number}` | "sign";

export interface EdgeFitTimingProps {
  words?: string[];
  letterGap?: number;
  hold?: number;
}

export const DEFAULT_WORDS = ["intros", "teasers", "recaps"];
export const LETTER_GAP = 3;
export const HOLD = 14;
const RISE = 6;
const LEAD = 3;
const SIGN_IN = 16;

/** The words shown: the default mark when the list is empty. */
export function wordsOf(words: string[]) {
  return words.length > 0 ? words : ["remocn"];
}

/** When each word takes over, and when the last one's hold ends. */
export function edgeFitWordTimes(
  words: string[],
  letterGap = LETTER_GAP,
  hold = HOLD,
) {
  const starts: number[] = [];
  let at = 0;
  for (const w of words) {
    starts.push(at);
    at += Math.max(1, Array.from(w).length - 1) * letterGap + 10 + hold;
  }
  return { starts, end: at };
}

// `word:<i>` runs until the next word cuts in; each follows the one before.
// Its letters arrive `gap` apart: each one's spring starts `lead` frames
// before its slot and it rises over `rise` (`firstRise` for the opening
// letter of the first word). The caption and logo (`sign`) rise in once the
// last word's last letter is due; it follows the last word.
export const edgeFitTimeline = defineTimeline<
  EdgeFitElementId,
  EdgeFitTimingProps
>(({ words = DEFAULT_WORDS, letterGap = LETTER_GAP, hold = HOLD }) => {
  const list = wordsOf(words);
  const { starts, end } = edgeFitWordTimes(list, letterGap, hold);
  const elements: TimelineElement<EdgeFitElementId>[] = list.map(
    (word, i): TimelineElement<EdgeFitElementId> => ({
      id: `word:${i}`,
      lane: "Words",
      label: word,
      start: starts[i],
      length: (i < list.length - 1 ? starts[i + 1] : end) - starts[i],
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats: { gap: letterGap, lead: LEAD, rise: RISE, firstRise: RISE + 2 },
    }),
  );
  const n = Array.from(list[list.length - 1]).length;
  elements.push({
    id: "sign",
    lane: "Sign",
    label: "caption and logo",
    start: starts[list.length - 1] + Math.max(0, n - 1) * letterGap,
    length: SIGN_IN,
    follows: `word:${list.length - 1}`,
  });
  return elements;
});
