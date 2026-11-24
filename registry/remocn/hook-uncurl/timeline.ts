import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The question rises in word by word with its question mark, the mark
// uncurls, the words the answer doesn't share sink out as the answer's own
// roll in, the shared words glide into place, and the stroke retracts into
// the answer's full stop. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type HookUncurlElementId =
  | `word:${number}`
  | "mark"
  | "uncurl"
  | "swap"
  | `out:${number}`
  | `in:${number}`
  | "retract";

export interface HookUncurlTimingProps {
  question?: string;
  answer?: string;
  stagger?: number;
  answerAt?: number;
}

export const DEFAULT_QUESTION = "Why make the video?";
export const DEFAULT_ANSWER = "Just make the video.";
const ENTER_LEN = 16;
const ENTER_STAGGER = 3;
const ENTER_SPREAD = 18;
const UNCURL_AT = 40;
const UNCURL_LEN = 15;
const SWAP_AT = 45;
const SWAP_STAGGER = 2;
const SWAP_SPREAD = 6;
const SINK_LEN = 6;
const ROLL_LEN = 12;
const RETRACT_AT = 63;
const RETRACT_LEN = 7;

/** The words of a line, upper-cased, without its end punctuation. */
export function words(s: string) {
  return s
    .trim()
    .replace(/[?.!…]+$/u, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
}

/** How many words the two lines share at the start and at the end. */
export function sharedEnds(A: string[], B: string[]) {
  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (
    suf < Math.min(A.length, B.length) - pre &&
    A[A.length - 1 - suf] === B[B.length - 1 - suf]
  )
    suf++;
  return { pre, suf };
}

// `word:<i>` rises question word `i` in; the words form a chain and `mark`
// (the question mark) follows them. `uncurl` straightens the mark. `swap`
// runs from the first word sinking until the retract; the shared words glide
// on a spring from its `glide` beat. `out:<k>` sinks the `k`th word the
// answer drops (its clip closes over `cut`), `in:<k>` rolls the `k`th new
// answer word in; each list is a chain. `retract` pulls the stroke into the
// full stop, which pops after it and takes the accent from `colorAt` to
// `colorEnd` past its end.
export const hookUncurlTimeline = defineTimeline<
  HookUncurlElementId,
  HookUncurlTimingProps
>(
  ({
    question = DEFAULT_QUESTION,
    answer = DEFAULT_ANSWER,
    stagger = ENTER_STAGGER,
    answerAt = UNCURL_AT,
  }): TimelineElement<HookUncurlElementId>[] => {
    const A = words(question);
    const B = words(answer);
    const { pre, suf } = sharedEnds(A, B);
    const uncurlAt = answerAt;
    const swapAt = SWAP_AT + answerAt - UNCURL_AT;
    const retractAt = RETRACT_AT + answerAt - UNCURL_AT;
    const es = Math.min(stagger, ENTER_SPREAD / Math.max(1, A.length));
    const enterAt = (i: number) => i * es - 2;
    const nOut = Math.max(1, A.length - pre - suf);
    const nIn = Math.max(1, B.length - pre - suf);
    const xs = Math.min(SWAP_STAGGER, SWAP_SPREAD / nOut);
    const ns = Math.min(SWAP_STAGGER, SWAP_SPREAD / nIn);
    const inAt = swapAt + SINK_LEN - 1;

    const elements: TimelineElement<HookUncurlElementId>[] = A.map(
      (word, i) => ({
        id: `word:${i}`,
        lane: "Question",
        label: word,
        start: enterAt(i),
        length: ENTER_LEN,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    elements.push(
      {
        id: "mark",
        lane: "Mark",
        label: "?",
        start: enterAt(Math.max(0, A.length - 1) + 1),
        length: ENTER_LEN,
        follows: A.length > 0 ? `word:${A.length - 1}` : undefined,
      },
      {
        id: "uncurl",
        lane: "Mark",
        label: "uncurl",
        start: uncurlAt,
        length: UNCURL_LEN,
      },
      {
        id: "swap",
        lane: "Answer",
        label: "swap",
        start: swapAt,
        length: retractAt - swapAt,
        follows: "uncurl",
        beats: { glide: 2 },
      },
    );
    for (let i = pre; i < A.length - suf; i++) {
      const k = i - pre;
      elements.push({
        id: `out:${k}`,
        lane: "Question",
        label: A[i],
        start: swapAt + k * xs,
        length: SINK_LEN,
        follows: k > 0 ? `out:${k - 1}` : "uncurl",
        beats: { cut: 2 },
      });
    }
    for (let j = pre; j < B.length - suf; j++) {
      const k = j - pre;
      elements.push({
        id: `in:${k}`,
        lane: "Answer",
        label: B[j],
        start: inAt + k * ns,
        length: ROLL_LEN,
        follows:
          k > 0 ? `in:${k - 1}` : A.length - suf > pre ? "out:0" : "swap",
      });
    }
    elements.push({
      id: "retract",
      lane: "Mark",
      label: "retract",
      start: retractAt,
      length: RETRACT_LEN,
      follows: "swap",
      beats: { colorAt: -2, colorEnd: 6 },
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
