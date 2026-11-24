import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first belief rising in, the camera panning from belief to belief while
// each one's words come on, then the pull back to the whole page. The slot
// per belief is fitted to the scene after `delay`. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type WholePageElementId = "intro" | `belief:${number}` | "pull";

export interface WholePageTimingProps {
  beliefs?: string[];
  /** Frames the whole page holds at the end. */
  hold?: number;
  /** Frames of the final pull back to the whole page. */
  pull?: number;
}

export const DEFAULT_BELIEFS = [
  "A launch video is part of the launch, not the chore you do after it.",
  "If it lives in code, it can live in the repo with everything else.",
  "Every frame you install is a file you are free to rewrite.",
  "Motion should explain the product. It should never show off.",
  "A team of one deserves a real film, too.",
  "The video goes out the same day the product does.",
];

const START = 6;
const PULL = 36;
const HOLD = 40;
/** Frames the page takes to fade in. */
const INTRO = 18;
/** Frames a word takes to come on. */
const WORD = 12;

// Belief `i` is focused from its arrival to the next one's: the camera pans
// to it over the `pan` frames before its start, and its words come on from
// half a pan early, `word` frames each. The pull follows the last belief.
export const wholePageTimeline = defineTimeline<
  WholePageElementId,
  WholePageTimingProps
>(
  (
    { beliefs = DEFAULT_BELIEFS, hold = HOLD, pull: pullLen = PULL },
    { length },
  ) => {
    const elements: TimelineElement<WholePageElementId>[] = [
      { id: "intro", lane: "Intro", label: "fade in", start: 0, length: INTRO },
    ];
    const n = beliefs.length;
    if (n === 0) return elements;
    const D = length;
    const per = Math.max(30, (D - START - pullLen - hold) / n);
    const pan = Math.min(16, per * 0.36);
    const arriveAt = (i: number) => START + i * per;
    const pullAt = START + n * per - 6;
    beliefs.forEach((belief, i) => {
      elements.push({
        id: `belief:${i}`,
        lane: "Beliefs",
        label: belief,
        start: arriveAt(i),
        length: per,
        follows: i > 0 ? `belief:${i - 1}` : undefined,
        beats: { pan, word: WORD },
      });
    });
    elements.push({
      id: "pull",
      lane: "Pull",
      label: "pull back",
      start: pullAt,
      length: pullLen,
      follows: `belief:${n - 1}`,
    });
    return elements;
  },
);
