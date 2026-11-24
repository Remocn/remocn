import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising word by word, its last word typed letter by letter and cut
// off by a dash, then the reply hitting the screen in two parts. Frames on
// the 30 fps scene timeline, after `delay`; the word gap fits the line into
// the clip itself, not into `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type CutOffElementId =
  | `word:${number}`
  | "fragment"
  | "dash"
  | "reply"
  | "payoff";

export interface CutOffTimingProps {
  line?: string;
  /** Frames per letter as the last word is typed. */
  charFrames?: number;
}

export const DEFAULT_LINE =
  "So first I export the clips, redo all the captions, then line up the mus";
const LETTER = 2;
const LEAD_IN = 6;
const WORD_IN = 9;
const DASH_HOLD = 4;
const HIT = 8;
const HIT_GAP = 9;
/** The reply's first part lands `REPLY_LEAD` before the cut, as it happens. */
const REPLY_LEAD = 3;
const MIN_HOLD = 40;

/** The line's words, trailing dashes and spaces dropped. */
export function lineWords(line: string) {
  return line
    .replace(/[\s—–-]+$/, "")
    .split(" ")
    .filter(Boolean);
}

// `word:<i>` rises over its length; the words follow one another. The last
// word (`fragment`) types a letter every `char` frames, then the `dash`
// holds until the cut. `reply` is the reply up to its split, landing with
// the cut; `payoff` is the rest.
export const cutOffTimeline = defineTimeline<
  CutOffElementId,
  CutOffTimingProps
>(({ line = DEFAULT_LINE, charFrames = LETTER }, { length }) => {
  const aWords = lineWords(line);
  const fragment = aWords[aWords.length - 1] ?? "";
  const fragLetters = Array.from(fragment).length;
  const fixedTail =
    fragLetters * charFrames + DASH_HOLD + HIT_GAP + HIT + MIN_HOLD;
  const gap = Math.max(
    3,
    Math.min(
      7,
      (length - LEAD_IN - fixedTail) / Math.max(1, aWords.length - 1),
    ),
  );
  const fragAt = LEAD_IN + (aWords.length - 1) * gap;
  const dashAt = fragAt + fragLetters * charFrames;
  const cutAt = dashAt + DASH_HOLD;
  const lead = aWords.slice(0, -1);
  const elements: TimelineElement<CutOffElementId>[] = lead.map((w, i) => ({
    id: `word:${i}`,
    lane: "Line",
    label: w,
    start: LEAD_IN + i * gap,
    length: WORD_IN,
    follows: i > 0 ? `word:${i - 1}` : undefined,
  }));
  elements.push(
    {
      id: "fragment",
      lane: "Line",
      label: fragment,
      start: fragAt,
      length: fragLetters * charFrames,
      follows: lead.length > 0 ? `word:${lead.length - 1}` : undefined,
      beats: { char: charFrames },
    },
    {
      id: "dash",
      lane: "Line",
      label: "dash",
      start: dashAt,
      length: DASH_HOLD,
      follows: "fragment",
    },
    {
      id: "reply",
      lane: "Reply",
      label: "reply",
      start: cutAt - REPLY_LEAD,
      length: HIT,
      follows: "dash",
    },
    {
      id: "payoff",
      lane: "Reply",
      label: "payoff",
      start: cutAt + HIT_GAP,
      length: HIT,
      follows: "reply",
    },
  );
  return elements;
});
