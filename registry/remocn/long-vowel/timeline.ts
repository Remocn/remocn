import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word rising letter by letter, the held vowel drawing out copy by copy
// on a spring, and the caption rising word by word. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LongVowelElementId =
  | `letter:${number}`
  | `copy:${number}`
  | `rest:${number}`;

export interface LongVowelTimingProps {
  word?: string;
  repeat?: number;
  rest?: string;
  /** Frame the vowel starts to stretch. */
  stretchAt?: number;
  /** Frames between the extra copies of the vowel drawing out. */
  stagger?: number;
}

export const DEFAULT_WORD = "Way";
export const DEFAULT_REST = "less keyframing.";

const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 2;
export const DRAWL_AT = 28;
export const DRAWL_GAP = 4;
/** A copy's spring has mostly drawn it out after this long. */
const DRAWL_LEN = 14;
const REST_GAP_AFTER = 4;
const REST_GAP = 3;
const REST_LEN = 16;

/** How many extra copies of the vowel are drawn out. */
export function copiesOf(repeat: number) {
  return Math.max(1, Math.round(repeat));
}

// `letter:<i>` rises letter `i` of the word over its length (the copies rise
// with the held letter), each following the one before. `copy:<k>` springs
// copy `k` of the vowel out from its start, each following the one before,
// the first following the last letter. `rest:<k>` rises caption word `k`,
// each following the one before, the first following the last copy.
export const longVowelTimeline = defineTimeline<
  LongVowelElementId,
  LongVowelTimingProps
>(
  ({
    word = DEFAULT_WORD,
    repeat = 5,
    rest = DEFAULT_REST,
    stretchAt = DRAWL_AT,
    stagger = DRAWL_GAP,
  }) => {
    const chars = Array.from(word);
    const copies = copiesOf(repeat);
    const restWords = rest ? rest.split(" ") : [];
    const restAt =
      stretchAt + (copies - 1) * stagger + DRAWL_LEN + REST_GAP_AFTER;
    const elements: TimelineElement<LongVowelElementId>[] = [
      ...chars.map(
        (ch, i): TimelineElement<LongVowelElementId> => ({
          id: `letter:${i}`,
          lane: "Word",
          label: ch,
          start: RISE_AT + i * RISE_GAP,
          length: RISE_LEN,
          follows: i > 0 ? `letter:${i - 1}` : undefined,
        }),
      ),
      ...Array.from(
        { length: copies },
        (_, k): TimelineElement<LongVowelElementId> => ({
          id: `copy:${k}`,
          lane: "Drawl",
          label: `copy ${k + 1}`,
          start: stretchAt + k * stagger,
          length: DRAWL_LEN,
          follows:
            k > 0
              ? `copy:${k - 1}`
              : chars.length > 0
                ? `letter:${chars.length - 1}`
                : undefined,
        }),
      ),
      ...restWords.map(
        (w, k): TimelineElement<LongVowelElementId> => ({
          id: `rest:${k}`,
          lane: "Caption",
          label: w,
          start: restAt + k * REST_GAP,
          length: REST_LEN,
          follows: k > 0 ? `rest:${k - 1}` : `copy:${copies - 1}`,
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
