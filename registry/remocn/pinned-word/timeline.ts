import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The pinned word fades in, the first line opens around it, then each next
// line flicks up through the pin while the word stays put. Frames on the 30
// fps scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type PinnedWordElementId = "word" | `line:${number}`;

export interface PinnedWordTimingProps {
  lines?: string[];
  word?: string;
  hold?: number;
  flick?: number;
}

export const DEFAULT_LINES = [
  "Ship a video tonight.",
  "Write the video in code.",
  "Own every video frame.",
];
export const DEFAULT_WORD = "video";
const HOLD = 36;
const FLICK = 18;
const INTRO_WORD = 0;
const WORD_IN = 12;
const INTRO_LINE = 8;
const OPEN = 20;
const OPEN_RIGHT = 3;
const FIRST_FLICK = 40;
const SHEEN = 24;

/** The lines shown: the word alone when there are none. */
export function linesOf(lines: string[], word: string) {
  return lines.length > 0 ? lines : [word];
}

// `word` fades the pinned word in. `line:0` opens the first line around it:
// the left side over `open` frames, the right side `right` frames later.
// `line:<k>` (from 1) flicks line `k` onto the pin; each line follows the
// one before, `hold` frames apart. A sheen runs over the word for `sheenLen`
// frames from each line's `sheen` beat.
export const pinnedWordTimeline = defineTimeline<
  PinnedWordElementId,
  PinnedWordTimingProps
>(
  ({
    lines = DEFAULT_LINES,
    word = DEFAULT_WORD,
    hold = HOLD,
    flick = FLICK,
  }): TimelineElement<PinnedWordElementId>[] => {
    const list = linesOf(lines, word);
    const n = list.length;
    const STEP = Math.max(flick + 6, hold);
    const flickAt = (k: number) => FIRST_FLICK + (k - 1) * STEP;
    const elements: TimelineElement<PinnedWordElementId>[] = [
      {
        id: "word",
        lane: "Pin",
        label: word,
        start: INTRO_WORD,
        length: WORD_IN,
      },
      {
        id: "line:0",
        lane: "Lines",
        label: list[0],
        start: INTRO_LINE,
        length: OPEN + OPEN_RIGHT,
        beats: { open: OPEN, right: OPEN_RIGHT, sheen: 4, sheenLen: SHEEN },
      },
    ];
    for (let k = 1; k < n; k++) {
      elements.push({
        id: `line:${k}`,
        lane: "Lines",
        label: list[k],
        start: flickAt(k),
        length: flick,
        follows: `line:${k - 1}`,
        beats: { sheen: flick * 0.4, sheenLen: SHEEN },
      });
    }
    return elements;
  },
);
