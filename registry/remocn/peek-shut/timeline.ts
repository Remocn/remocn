import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The base line drawing across, the question rising word by word, the slot
// opening on the picture, snapping shut, then the refusal and the "when"
// line rising word by word. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. When the schedule runs past the clip (less a hold) it
// is compressed to fit (`k`, down to 0.6). The ids are public: a saved
// `timing` prop refers to them.

export type PeekShutElementId =
  | "line"
  | `question:${number}`
  | "open"
  | "shut"
  | `refusal:${number}`
  | `when:${number}`;

export interface PeekShutTimingProps {
  question?: string;
  refusal?: string;
  when?: string;
  /** Frames between words as a line rises in. */
  stagger?: number;
  /** Frame the slot snaps shut; the refusal follows it. */
  shutAt?: number;
}

export const DEFAULT_QUESTION = "Want a peek?";
export const DEFAULT_REFUSAL = "That’s all you get.";
export const DEFAULT_WHEN = "The rest, Monday.";

const LINE_LEN = 18;
const Q_AT = 6;
export const STAGGER = 3;
const WORD_LEN = 14;
const OPEN_AT = 30;
const OPEN_LEN = 16;
export const SHUT_AT = 80;
const SHUT_LEN = 6;
const R_AT = 90;
const WHEN_AT = 102;
/** The "when" line waits at least this long after the refusal's last word starts. */
const WHEN_GAP = 4;
/** Frames the clip holds after the motion ends, before compression kicks in. */
const MIN_HOLD = 34;

/** A line's words, as the layout splits them. */
export function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

// `line` draws the base line. `question:<i>` rises question word `i`, each
// following the one before. `open` opens the slot and `shut` snaps it shut;
// the picture pans from the start of `open` to the end of `shut`.
// `refusal:<i>` and `when:<i>` rise their words in two chains, the refusal
// following the shut and the "when" line following the refusal. `length`
// here is the clip after `delay`, in scene frames.
export const peekShutTimeline = defineTimeline<
  PeekShutElementId,
  PeekShutTimingProps
>(
  (
    {
      question = DEFAULT_QUESTION,
      refusal = DEFAULT_REFUSAL,
      when = DEFAULT_WHEN,
      stagger = STAGGER,
      shutAt = SHUT_AT,
    },
    { length },
  ) => {
    const qWords = split(question);
    const rWords = split(refusal);
    const wWords = split(when);
    const rAt = R_AT + (shutAt - SHUT_AT);
    const whenAt = Math.max(
      WHEN_AT + (shutAt - SHUT_AT),
      rAt + rWords.length * stagger + WHEN_GAP,
    );
    const motionEnd = whenAt + (wWords.length - 1) * stagger + WORD_LEN;
    const room = length - MIN_HOLD;
    const k = Math.max(0.6, Math.min(1, room / motionEnd));

    const words = (
      list: string[],
      at: number,
      lane: string,
      id: (i: number) => PeekShutElementId,
      lead: PeekShutElementId | undefined,
    ) =>
      list.map(
        (w, i): TimelineElement<PeekShutElementId> => ({
          id: id(i),
          lane,
          label: w,
          start: (at + i * stagger) * k,
          length: WORD_LEN * k,
          follows: i > 0 ? id(i - 1) : lead,
        }),
      );

    const elements: TimelineElement<PeekShutElementId>[] = [
      {
        id: "line",
        lane: "Slot",
        label: "line",
        start: 0,
        length: LINE_LEN * k,
      },
      ...words(qWords, Q_AT, "Question", (i) => `question:${i}`, undefined),
      {
        id: "open",
        lane: "Slot",
        label: "open",
        start: OPEN_AT * k,
        length: OPEN_LEN * k,
        follows: "line",
      },
      {
        id: "shut",
        lane: "Slot",
        label: "shut",
        start: shutAt * k,
        length: SHUT_LEN * k,
        follows: "open",
      },
      ...words(rWords, rAt, "Refusal", (i) => `refusal:${i}`, "shut"),
      ...words(
        wWords,
        whenAt,
        "When",
        (i) => `when:${i}`,
        rWords.length > 0 ? `refusal:${rWords.length - 1}` : "shut",
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
