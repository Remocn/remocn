import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first word rising in letter by letter, each rung of the ladder
// swapping the letters that change, and the poster rule under the last
// word. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type WordLadderElementId = "enter" | `rung:${number}` | "poster";

export interface WordLadderTimingProps {
  words?: string[];
  /** Frames between one rung and the next. */
  rung?: number;
  /** Frames between letters that change on the same rung. */
  stagger?: number;
}

export const DEFAULT_WORDS = ["idea", "item", "stem", "step", "ship"];
const RUNG = 24;
const SUB = 3;
/** The first word's letters rise over `ENTER`, `ENTER_STAGGER` apart. */
const ENTER_STAGGER = 2;
const ENTER = 18;
const FIRST = 32;
/** On a rung the old letter drops over `DROP`; the new one rises over `RISE`, `RISE_DELAY` after. */
const DROP = 8;
const RISE_DELAY = 7;
const RISE = 16;
/** The word glides to its new width over `GLIDE`, `GLIDE_DELAY` into the rung. */
const GLIDE_DELAY = 3;
const GLIDE = 16;
/** A slot's accent mark shows `BAR_LEAD` before its rung and grows over `BAR_IN`. */
const BAR_LEAD = 9;
const BAR_IN = 10;
const BAR_OUT = 7;
const SETTLE = 12;
const POSTER_GAP = 6;
const POSTER = 18;

/** The words as letters, one empty rung when there are none. */
export function rungsOf(words: string[]) {
  return (words.length > 0 ? words : [""]).map((w) => Array.from(w));
}

/** Slots that change between rung `k` and the next, in order. */
function changedSlots(rungs: string[][], k: number) {
  const slots = Math.max(1, ...rungs.map((r) => r.length));
  const out: number[] = [];
  for (let i = 0; i < slots; i++) {
    if ((rungs[k][i] ?? "") !== (rungs[k + 1][i] ?? "")) out.push(i);
  }
  return out;
}

// `rung:<k>` is the step onto word `k`: its changed letters drop and rise
// `stagger` apart from its start. `mark` (negative) is when the accent mark
// under a changing slot shows, from the rung's start.
export const wordLadderTimeline = defineTimeline<
  WordLadderElementId,
  WordLadderTimingProps
>(({ words = DEFAULT_WORDS, rung = RUNG, stagger = SUB }) => {
  const rungs = rungsOf(words);
  const slots = Math.max(1, ...rungs.map((r) => r.length));
  const steps = rungs.length - 1;
  const stepAt = (k: number) => FIRST + k * rung;
  const swapEnds: number[] = [];
  for (let k = 0; k < steps; k++) {
    changedSlots(rungs, k).forEach((_, order) => {
      swapEnds.push(stepAt(k) + order * stagger + RISE_DELAY + RISE);
    });
  }
  const lastSwap = Math.max(stepAt(0), ...swapEnds);
  const posterAt = steps > 0 ? lastSwap + POSTER_GAP : stepAt(0);

  const elements: TimelineElement<WordLadderElementId>[] = [
    {
      id: "enter",
      lane: "Word",
      label: words[0] ?? "",
      start: 0,
      length: ENTER + (slots - 1) * ENTER_STAGGER,
      beats: { stagger: ENTER_STAGGER, letter: ENTER },
    },
  ];
  for (let k = 0; k < steps; k++) {
    elements.push({
      id: `rung:${k + 1}`,
      lane: "Rungs",
      label: words[k + 1] ?? "",
      start: stepAt(k),
      length: (k + 1 < steps ? stepAt(k + 1) : posterAt) - stepAt(k),
      follows: k > 0 ? `rung:${k}` : "enter",
      beats: {
        stagger,
        drop: DROP,
        riseDelay: RISE_DELAY,
        rise: RISE,
        glideDelay: GLIDE_DELAY,
        glide: GLIDE,
        mark: -BAR_LEAD,
        barIn: BAR_IN,
        barOut: BAR_OUT,
        settle: SETTLE,
      },
    });
  }
  elements.push({
    id: "poster",
    lane: "Poster",
    label: words[words.length - 1] ?? "",
    start: posterAt,
    length: POSTER,
    follows: steps > 0 ? `rung:${steps}` : "enter",
  });
  return elements;
});
