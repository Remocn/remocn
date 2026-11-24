import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first sentence's words rising in, each later state of the sentence
// sliding its words apart, and the words a state adds rising into the gaps.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type WordInsertElementId =
  | `enter:${number}`
  | `state:${number}`
  | `insert:${number}:${number}`;

export interface WordInsertTimingProps {
  states?: string[];
  /** Frames between one state of the sentence and the next. */
  beat?: number;
  /** Frames between words as they enter. */
  stagger?: number;
}

export const DEFAULT_STATES = [
  "Launch videos.",
  "Launch videos, as code.",
  "Beautiful launch videos, as code.",
];
export const ENTER_STAGGER = 3;
const ENTER_LEN = 18;
export const FIRST = 36;
export const STEP = 50;
const MOVE = 22;
export const INSERT_DELAY = 12;
export const INSERT_LEN = 18;

export function wordKey(token: string) {
  return token.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function tokenize(state: string) {
  return state.split(/\s+/).filter(Boolean);
}

/** The sentence states as words, one empty state when there are none. */
export function tokenizeStates(states: string[]) {
  return (states.length ? states : [""]).map(tokenize);
}

/** Pairs of words two states share, as [index in a, index in b]. */
export function matchTokens(a: string[], b: string[]) {
  const ka = a.map(wordKey);
  const kb = b.map(wordKey);
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] =
        ka[i] === kb[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (ka[i] === kb[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

// `enter:<i>` is word `i` of the first state rising in; the words form a
// chain. `state:<s>` is the sentence moving to state `s` (from 1): words it
// keeps slide, words it drops fade out over `fade`. Each state follows the
// one before. `insert:<s>:<k>` is the `k`-th word state `s` adds, rising in;
// they chain after their state.
export const wordInsertTimeline = defineTimeline<
  WordInsertElementId,
  WordInsertTimingProps
>(({ states = DEFAULT_STATES, beat = STEP, stagger = ENTER_STAGGER }) => {
  const tokenized = tokenizeStates(states);
  const out: TimelineElement<WordInsertElementId>[] = [];
  tokenized[0].forEach((word, i) => {
    const start = i * stagger;
    out.push({
      id: `enter:${i}`,
      lane: "Words",
      label: word,
      start,
      length: ENTER_LEN,
      follows: i > 0 ? `enter:${i - 1}` : undefined,
    });
  });
  const startOf = (s: number) => FIRST + (s - 1) * beat;
  for (let s = 1; s < tokenized.length; s++) {
    out.push({
      id: `state:${s}`,
      lane: "States",
      label: states[s] ?? "",
      start: startOf(s),
      length: MOVE,
      follows: s > 1 ? `state:${s - 1}` : undefined,
      beats: { fade: MOVE * 0.45 },
    });
    const kept = new Set(
      matchTokens(tokenized[s - 1], tokenized[s]).map(([, j]) => j),
    );
    let order = 0;
    tokenized[s].forEach((word, j) => {
      if (kept.has(j)) return;
      const k = order++;
      out.push({
        id: `insert:${s}:${k}`,
        lane: "Inserts",
        label: word,
        start: startOf(s) + INSERT_DELAY + k * stagger,
        length: INSERT_LEN,
        follows: k > 0 ? `insert:${s}:${k - 1}` : `state:${s}`,
      });
    });
  }
  return out.sort((a, b) => a.start - b.start);
});
