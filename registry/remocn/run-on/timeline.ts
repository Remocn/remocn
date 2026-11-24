import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The run-on sentence piling up word by word, faster and faster, scrolling
// as it overflows; the full stop slamming in; the wall draining away while
// the stop travels down to end the promise; the promise rising word by word
// and its highlight lighting up. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. On clips shorter than `BASE` frames the schedule is
// compressed to fit (`k`). The ids are public: a saved `timing` prop refers
// to them.

export type RunOnElementId =
  | `word:${number}`
  | "stop"
  | "drain"
  | `promise:${number}`
  | "highlight";

export interface RunOnTimingProps {
  text?: string;
  promise?: string;
  /** Frames the full stop holds before the sentence drains away. */
  hold?: number;
}

export const DEFAULT_TEXT =
  "Open last year’s project and relink the fonts and nudge every keyframe and render and spot a typo and render it all again";
export const DEFAULT_PROMISE = "Or change one line.";

/** Clip length the schedule is written for. */
const BASE = 200;
const START = 6;
const FIRST_GAP = 9;
const LAST_GAP = 2.6;
const REVEAL = 6;
/** A word that breaks onto a new line scrolls the wall over `SCROLL`. */
const SCROLL = 10;
const STOP_GAP = 7;
const SLAM = 5;
const HOLD = 16;
const DRAIN = 16;
/** The stop keeps travelling `DOT_TAIL` past the end of the drain. */
const DOT_TAIL = 6;
const PROMISE_LAG = 5;
const PROMISE_STAGGER = 4;
const PROMISE_IN = 16;
/** The highlight lights from `LIT_AT` to `LIT_END` after the first promise word lands. */
const LIT_AT = 4;
const LIT_END = 14;

/** The sentence without its closing punctuation. */
export function sentenceBody(text: string) {
  return text.trim().replace(/[.!?…]+$/, "");
}

/** The promise without its closing full stop, which the travelling stop sets. */
export function promiseBody(promise: string) {
  return promise.trim().replace(/\.$/, "");
}

function words(s: string) {
  return s.match(/\S+/g) ?? [];
}

// `word:<i>` reveals over its length, the gaps tightening; each follows the
// one before. `stop` slams in after the last word; `drain` empties the wall
// after the hold, the stop travelling on `tail` past its end. `promise:<i>`
// rises over its length, each following the one before; `highlight` lights
// from its `lit` beat to its end. `length` here is the clip length without
// `speed`, as the compression is counted.
export const runOnTimeline = defineTimeline<RunOnElementId, RunOnTimingProps>(
  (
    { text = DEFAULT_TEXT, promise = DEFAULT_PROMISE, hold = HOLD },
    { length },
  ) => {
    const k = Math.min(1, length / BASE);
    const body = words(sentenceBody(text));
    const said = words(promiseBody(promise));
    const n = body.length;
    const arrive: number[] = [];
    let acc = START;
    for (let i = 0; i < n; i++) {
      arrive.push(acc);
      const p = n > 1 ? i / (n - 1) : 1;
      acc += FIRST_GAP + (LAST_GAP - FIRST_GAP) * p ** 0.6;
    }
    const stopAt = arrive[n - 1] + STOP_GAP;
    const drainAt = stopAt + SLAM + hold;
    const promiseAt = drainAt + DRAIN - PROMISE_LAG;

    const elements: TimelineElement<RunOnElementId>[] = body.map((w, i) => ({
      id: `word:${i}`,
      lane: "Sentence",
      label: w,
      start: arrive[i] * k,
      length: REVEAL * k,
      follows: i > 0 ? `word:${i - 1}` : undefined,
      beats: { scroll: SCROLL * k },
    }));
    elements.push(
      {
        id: "stop",
        lane: "Stop",
        label: "full stop",
        start: stopAt * k,
        length: SLAM * k,
        follows: n > 0 ? `word:${n - 1}` : undefined,
      },
      {
        id: "drain",
        lane: "Stop",
        label: "drain",
        start: drainAt * k,
        length: DRAIN * k,
        follows: "stop",
        beats: { tail: DOT_TAIL * k },
      },
    );
    said.forEach((w, i) => {
      elements.push({
        id: `promise:${i}`,
        lane: "Promise",
        label: w,
        start: (promiseAt + i * PROMISE_STAGGER) * k,
        length: PROMISE_IN * k,
        follows: i > 0 ? `promise:${i - 1}` : "drain",
      });
    });
    elements.push({
      id: "highlight",
      lane: "Highlight",
      label: "highlight",
      start: (promiseAt + PROMISE_IN) * k,
      length: LIT_END * k,
      follows: said.length > 0 ? "promise:0" : "drain",
      beats: { lit: LIT_AT * k },
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
