import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The transcript spoken word by word under a running clock, the filler words
// marked, each run of filler collapsing, the kept words reflowing into one
// line, the line setting into the headline and the highlight lighting up.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type FillerCutElementId =
  | `word:${number}`
  | "clock"
  | "mark"
  | `cut:${number}`
  | "reflow"
  | "set"
  | "highlight";

export interface FillerCutTimingProps {
  transcript?: string;
  keep?: string;
  stagger?: number;
}

export const DEFAULT_TRANSCRIPT =
  "So, um, ship your, like, launch video, uh, today. You know?";
export const DEFAULT_KEEP = "Ship your launch video today.";

const SPEAK_AT = 4;
const SPEAK_PER = 2;
const SPEAK_MAX = 28;
const MARK_AT = 34;
export const MARK_TO_CUT = 10;
export const CUT_GAP = 6;
export const CUT_LEN = 10;
export const REFLOW_GAP = 2;
const REFLOW_LEN = 12;
const SET_GAP = 4;
const SET_LEN = 24;

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export interface Token {
  said: string;
  keep: number;
  cut: number;
}

/**
 * The transcript as said, matched against the kept line: each word either
 * survives (its index in `keep`) or belongs to a run of filler that cuts
 * together.
 */
export function plan(transcript: string, keep: string) {
  const said = transcript.split(/\s+/).filter(Boolean);
  const kept = keep.split(/\s+/).filter(Boolean);
  const tokens: Token[] = said.map((s) => ({ said: s, keep: -1, cut: -1 }));
  let j = 0;
  for (let i = 0; i < tokens.length && j < kept.length; i++)
    if (norm(tokens[i].said) === norm(kept[j])) tokens[i].keep = j++;
  const extra = kept.map((_, q) => q).filter((q) => q >= j);
  let cuts = 0;
  tokens.forEach((tk, i) => {
    if (tk.keep >= 0) return;
    tk.cut = i > 0 && tokens[i - 1].cut >= 0 ? tokens[i - 1].cut : cuts++;
  });
  return { tokens, kept, extra, cuts };
}

// `word:<i>` is word `i` of the transcript being said, a chain. The clock
// fades in with them. The mark follows the last word; `cut:<k>` is run `k`
// of filler collapsing, a chain after the mark. The reflow follows the last
// cut: words moving up ease over `early`, the others from `lateAt`. The set
// into the headline follows the reflow: the words drop into their lines
// over `drop`, the clock fades over `clockOut` and words the transcript
// never said rise from `extraAt`. The highlight follows the set.
export const fillerCutTimeline = defineTimeline<
  FillerCutElementId,
  FillerCutTimingProps
>(
  ({
    transcript = DEFAULT_TRANSCRIPT,
    keep = DEFAULT_KEEP,
    stagger = CUT_GAP,
  }) => {
    const P = plan(transcript, keep);
    const n = P.tokens.length;
    const speakPer = Math.min(SPEAK_PER, SPEAK_MAX / Math.max(1, n - 1));
    const markAt = Math.max(MARK_AT, SPEAK_AT + (n - 1) * speakPer + 8);
    const cutAt = markAt + MARK_TO_CUT;
    const cutEnd = cutAt + Math.max(0, P.cuts - 1) * stagger + CUT_LEN;
    const reflowAt = cutEnd + REFLOW_GAP;
    const setAt = reflowAt + REFLOW_LEN + SET_GAP;
    const cutLabels = Array.from({ length: P.cuts }, (_, k) =>
      P.tokens
        .filter((tk) => tk.cut === k)
        .map((tk) => tk.said)
        .join(" "),
    );
    const elements: TimelineElement<FillerCutElementId>[] = [
      ...P.tokens.map(
        (tk, i): TimelineElement<FillerCutElementId> => ({
          id: `word:${i}`,
          lane: "Transcript",
          label: tk.said,
          start: SPEAK_AT + i * speakPer,
          length: 8,
          follows: i > 0 ? `word:${i - 1}` : undefined,
        }),
      ),
      {
        id: "clock",
        lane: "Clock",
        label: "clock",
        start: SPEAK_AT + 4,
        length: 14,
      },
      {
        id: "mark",
        lane: "Filler",
        label: "mark the filler",
        start: markAt,
        length: 8,
        follows: n > 0 ? `word:${n - 1}` : undefined,
      },
      ...cutLabels.map(
        (label, k): TimelineElement<FillerCutElementId> => ({
          id: `cut:${k}`,
          lane: "Filler",
          label,
          start: cutAt + k * stagger,
          length: CUT_LEN,
          follows: k > 0 ? `cut:${k - 1}` : "mark",
        }),
      ),
      {
        id: "reflow",
        lane: "Line",
        label: "reflow",
        start: reflowAt,
        length: REFLOW_LEN,
        follows: P.cuts > 0 ? `cut:${P.cuts - 1}` : "mark",
        beats: { early: REFLOW_LEN * 0.6, lateAt: REFLOW_LEN * 0.4 },
      },
      {
        id: "set",
        lane: "Line",
        label: "set the headline",
        start: setAt,
        length: SET_LEN,
        follows: "reflow",
        beats: { drop: SET_LEN * 0.7, clockOut: 10, extraAt: 8 },
      },
      {
        id: "highlight",
        lane: "Highlight",
        label: "highlight",
        start: setAt + SET_LEN - 6,
        length: 16,
        follows: "set",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
