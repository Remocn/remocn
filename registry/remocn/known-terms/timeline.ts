import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each pair coming in: its video term rising alone in the middle, sliding
// left while the dev term pushes in from the right and the joiner appears,
// then settling. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The pairs are spread to fill the clip, leaving `hold` at the end.
// The ids are public: a saved `timing` prop refers to them.

export type KnownTermsElementId = `pair:${number}`;

export interface TermPair {
  video: string;
  dev: string;
  joiner?: string;
}

export interface KnownTermsTimingProps {
  pairs?: TermPair[];
  hold?: number;
}

export const DEFAULT_PAIRS: TermPair[] = [
  { video: "A scene", dev: "a component." },
  { video: "Timing", dev: "a prop." },
  { video: "An edit", dev: "a commit." },
  { video: "A render", dev: "a build." },
  { video: "Your launch", dev: "a deploy." },
];

export const HOLD = 33;
const STEP = 14;
const LEAD = 3;
const ARRIVE = 10;
const ALONE = 6;
const SLIDE = 14;
const PUSH_DELAY = 1;
const PUSH = 14;
const JOIN_IN = 8;
const SETTLE = 12;
const LINE_LEN = LEAD + ARRIVE + ALONE + SLIDE;

/** The pairs shown: the defaults when the list is empty. */
export function pairsOf(pairs: TermPair[]) {
  return pairs.length > 0 ? pairs : DEFAULT_PAIRS;
}

// `pair:<k>` starts on its row's slot, when the block starts making room
// for it (over `lift`) and the row before dims (over `dim`). Its video term
// rises `enter` later over `arrive`, stands `alone`, then slides over
// `slide`; the dev term pushes in `pushDelay` into the slide over `push`,
// the joiner fades in over `joinIn` late in the slide, and the colour
// settles over `settle` after it. The pairs form a chain.
export const knownTermsTimeline = defineTimeline<
  KnownTermsElementId,
  KnownTermsTimingProps
>(({ pairs = DEFAULT_PAIRS, hold = HOLD }, { length }) => {
  const list = pairsOf(pairs);
  const n = list.length;
  const span = length;
  const period =
    n > 1 ? Math.min(40, Math.max(24, (span - LINE_LEN - hold) / (n - 1))) : 0;
  return list.map((p, k): TimelineElement<KnownTermsElementId> => {
    const enter = k > 0 ? LEAD : 0;
    return {
      id: `pair:${k}`,
      lane: "Pairs",
      label: `${p.video} ${p.dev}`,
      start: k * period,
      length: enter + ARRIVE + ALONE + SLIDE + SETTLE,
      follows: k > 0 ? `pair:${k - 1}` : undefined,
      beats: {
        lift: STEP,
        dim: STEP + 6,
        enter,
        arrive: ARRIVE,
        alone: ALONE,
        slide: SLIDE,
        pushDelay: PUSH_DELAY,
        push: PUSH,
        joinIn: JOIN_IN,
        settle: SETTLE,
      },
    };
  });
});
