import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word rising in, the line crawling past to its end, the cue rising in,
// the rewind and zoom back onto the focus words, and the focus taking the
// accent while the rest clears. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. When the clip is too short for the whole motion plus
// a hold, the schedule is played up to 1/0.55 times faster (`fit`). The ids
// are public: a saved `timing` prop refers to them.

export type DoubleTakeElementId =
  | `word:${number}`
  | "crawl"
  | "cue"
  | "rewind"
  | "focus";

export interface DoubleTakeTimingProps {
  text?: string;
  stagger?: number;
  hold?: number;
}

export const DEFAULT_TEXT =
  "One person wrote this entire launch video over a single lunch break.";
export const IN_STAGGER = 3;
export const STOP_HOLD = 8;

const IN_LEN = 14;
const CRAWL_AT = 16;
const PER_WORD = 6.5;
const CUE_AT = 2;
const CUE_LEN = 14;
const REWIND_LEN = 24;
const ZOOM_AT = REWIND_LEN * 0.35;
const TINT_LEAD = 10;
const TINT_TAIL = 2;
const CLEAR_LEAD = 6;
const CLEAR_LEN = 12;
/** Frames the line rests at the very end, kept even on a short clip. */
const MIN_HOLD = 26;
/** The smallest `fit`: a short clip speeds the schedule up 1/0.55 at most. */
const MIN_FIT = 0.55;

// The rewind's `zoom` beat is when the zoom onto the focus starts. The focus
// starts tinting before the rewind lands: `tint` is when the tint is full,
// `fade` when the other words start to clear. The words form a chain; the
// cue and the rewind follow the crawl, the focus follows the rewind.
// `length` is the clip length after `speed`: when the motion and the final
// hold don't fit, every start, length and beat shrinks by `fit`.
export const doubleTakeTimeline = defineTimeline<
  DoubleTakeElementId,
  DoubleTakeTimingProps
>(
  (
    { text = DEFAULT_TEXT, stagger = IN_STAGGER, hold = STOP_HOLD },
    { length },
  ) => {
    const words = text.match(/\S+/g) ?? [];
    const crawlLen = Math.max(36, Math.min(120, words.length * PER_WORD));
    const stopAt = CRAWL_AT + crawlLen;
    const rewindAt = stopAt + hold;
    const landAt = rewindAt + REWIND_LEN;
    const motionEnd = landAt + CLEAR_LEN;
    const fit = Math.max(MIN_FIT, Math.min(1, (length - MIN_HOLD) / motionEnd));
    const elements: TimelineElement<DoubleTakeElementId>[] = words.map(
      (word, i): TimelineElement<DoubleTakeElementId> => ({
        id: `word:${i}`,
        lane: "Words",
        label: word,
        start: i * stagger * fit,
        length: IN_LEN * fit,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    elements.push(
      {
        id: "crawl",
        lane: "Line",
        label: "crawl",
        start: CRAWL_AT * fit,
        length: crawlLen * fit,
      },
      {
        id: "cue",
        lane: "Cue",
        label: "cue",
        start: (stopAt + CUE_AT) * fit,
        length: CUE_LEN * fit,
        follows: "crawl",
      },
      {
        id: "rewind",
        lane: "Line",
        label: "rewind",
        start: rewindAt * fit,
        length: REWIND_LEN * fit,
        follows: "crawl",
        beats: { zoom: ZOOM_AT * fit },
      },
      {
        id: "focus",
        lane: "Focus",
        label: "focus",
        start: (landAt - TINT_LEAD) * fit,
        length: (TINT_LEAD + CLEAR_LEN) * fit,
        follows: "rewind",
        beats: {
          tint: (TINT_LEAD + TINT_TAIL) * fit,
          fade: (TINT_LEAD - CLEAR_LEAD) * fit,
        },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
