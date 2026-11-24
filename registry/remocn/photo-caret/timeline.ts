import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The photo tile hopping along the line like a caret, each word typing in as
// it leaves, the hops quickening; the far photos drifting in from the start,
// the near ones popping in after the accent word, and the slow push through
// the hold. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type PhotoCaretElementId =
  | "intro"
  | `word:${number}`
  | "push"
  | `far:${number}`
  | `near:${number}`;

export interface PhotoCaretTimingProps {
  text?: string;
  firstStep?: number;
  hold?: number;
}

export const DEFAULT_TEXT = "Your launch, / your name / on it.";
export const DEFAULT_FIRST_STEP = 12;

export const BEAT = {
  intro: 12,
  decay: 0.88,
  minStep: 6,
  breath: 9,
  reveal: 8,
  settle: 12,
  hold: 45,
};

/** The tile grows from the big photo into its slot over this many frames. */
const INTRO = 16;
/** A word fades in over `fade` while it types in over `reveal`. */
const FADE = 4;
/** The tile squashes on each hop, peaking at `squashPeak`. */
const SQUASH_PEAK = 3;
const SQUASH = 9;
/** The accent word takes its colour over this many frames. */
const ACCENT = 10;
/** The push eases in over the hold, short of its end by this much. */
const PUSH_SHORT = 12;
/** Far photos drift in every `FAR_GAP` from `FAR_AT`; near ones after the payoff. */
const FAR_AT = -2;
const FAR_GAP = 4;
const NEAR_AT = 2;
const NEAR_GAP = 3;
/** Both photo layouts have three near photos, then four far ones. */
const NEAR_COUNT = 3;
const FAR_COUNT = 4;

export const parseLines = (text: string) =>
  text
    .split("/")
    .map((l) => l.trim().split(/\s+/).filter(Boolean))
    .filter((l) => l.length > 0);

export const hopTimes = (count: number, firstStep: number) => {
  const out: number[] = [];
  let t = BEAT.intro;
  for (let k = 0; k < count; k++) {
    if (k === count - 1) t += BEAT.breath;
    out.push(t);
    const g = Math.max(
      BEAT.minStep,
      Math.round((firstStep * BEAT.decay ** k) / 3) * 3,
    );
    t += g;
  }
  return out;
};

// `intro` is the tile growing into place. `word:<i>` is the hop off word `i`
// with the word typing in, until the next hop; the words form a chain. The
// last one runs through the settle and carries the accent beat; `push`
// follows it. `far:<j>` and `near:<j>` are the photos, in their layout's
// order; the near ones follow the last word.
export const photoCaretTimeline = defineTimeline<
  PhotoCaretElementId,
  PhotoCaretTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    firstStep = DEFAULT_FIRST_STEP,
    hold = BEAT.hold,
  }) => {
    const words = parseLines(text).flat();
    const n = words.length;
    const hops = hopTimes(n, firstStep);
    const payoff = hops[n - 1];
    const elements: TimelineElement<PhotoCaretElementId>[] = [
      {
        id: "intro",
        lane: "Tile",
        label: "intro",
        start: 0,
        length: INTRO,
      },
    ];
    for (let j = 0; j < FAR_COUNT; j++) {
      elements.push({
        id: `far:${j}`,
        lane: "Far photos",
        label: `far photo ${j + 1}`,
        start: j * FAR_GAP + FAR_AT,
        length: FAR_GAP,
        follows: j > 0 ? `far:${j - 1}` : undefined,
      });
    }
    words.forEach((word, k) => {
      const last = k === n - 1;
      elements.push({
        id: `word:${k}`,
        lane: "Words",
        label: word,
        start: hops[k],
        length: last ? BEAT.settle : hops[k + 1] - hops[k],
        follows: k > 0 ? `word:${k - 1}` : undefined,
        beats: {
          reveal: BEAT.reveal,
          fade: FADE,
          squashPeak: SQUASH_PEAK,
          squash: SQUASH,
          accent: ACCENT,
        },
      });
    });
    if (n > 0) {
      elements.push({
        id: "push",
        lane: "Camera",
        label: "push",
        start: payoff + BEAT.settle,
        length: hold - PUSH_SHORT,
        follows: `word:${n - 1}`,
      });
      for (let j = 0; j < NEAR_COUNT; j++) {
        elements.push({
          id: `near:${j}`,
          lane: "Near photos",
          label: `near photo ${j + 1}`,
          start: payoff + NEAR_AT + j * NEAR_GAP,
          length: NEAR_GAP,
          follows: j > 0 ? `near:${j - 1}` : `word:${n - 1}`,
        });
      }
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
