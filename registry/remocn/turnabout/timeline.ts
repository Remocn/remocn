import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word of the first line rising in, the turn (shared words lift into
// lanes and travel to their places in the second line) and the landing
// (they drop back, the new words rise in and the highlight lights). Frames
// on the 30 fps scene timeline, after `delay` and `speed`. On a clip shorter
// than 150 frames the whole schedule shrinks to fit (`k`). The ids are
// public: a saved `timing` prop refers to them.

export type TurnaboutElementId = `word:${number}` | "turn" | "land";

export interface TurnaboutTimingProps {
  before?: string;
  stagger?: number;
}

export const DEFAULT_BEFORE = "You work for the video.";
export const STAGGER = 3;

const BASE = 150;
const IN = 4;
const ENTER = 16;
const TURN = 52;
const LIFT = 13;
const TRAVEL = 30;
const LIT = 8;

/** The words and punctuation runs of a line, with their character spans. */
export function tokenize(s: string) {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[^\s.,!?…;:]+|[.,!?…;:]+/g;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

// The words of the first line form a chain. In the turn the shared words
// lift over `lift`, start travelling at `travel` and travel for `travelLen`.
// The landing starts as they drop back, over `drop`; the new words rise in
// over `drop + newIn`, and the highlight lights from `drop + litLead` to
// `drop + lit`. The landing follows the turn. `length` is the clip length
// without `speed`, as the fit is counted.
export const turnaboutTimeline = defineTimeline<
  TurnaboutElementId,
  TurnaboutTimingProps
>(({ before = DEFAULT_BEFORE, stagger = STAGGER }, { length }) => {
  const k = Math.min(1, length / BASE);
  const t1 = TURN + LIFT * 0.6;
  const t2 = t1 + TRAVEL;
  const dropAt = t2 - LIFT * 0.4;
  const elements: TimelineElement<TurnaboutElementId>[] = [
    ...tokenize(before).map(
      (tk, i): TimelineElement<TurnaboutElementId> => ({
        id: `word:${i}`,
        lane: "Words",
        label: tk.text,
        start: (IN + i * stagger) * k,
        length: ENTER * k,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    ),
    {
      id: "turn",
      lane: "Turn",
      label: "Words travel",
      start: TURN * k,
      length: (t2 - TURN) * k,
      beats: { lift: LIFT * k, travel: LIFT * 0.6 * k, travelLen: TRAVEL * k },
    },
    {
      id: "land",
      lane: "Turn",
      label: "Words land",
      start: dropAt * k,
      length: (LIFT + LIT) * k,
      follows: "turn",
      beats: { drop: LIFT * k, newIn: 4 * k, litLead: -2 * k, lit: LIT * k },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
