import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each cause-and-effect pair rising in word by word, the effect line
// trailing the cause, and dropping out as the next pair comes in. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type EditRippleElementId = `pair:${number}`;

/** One cause and its effect (`EditRipplePair`). */
export interface RipplePair {
  cause: string;
  effect: string;
}

export interface EditRippleTimingProps {
  pairs?: RipplePair[];
  lag?: number;
}

export const DEFAULT_PAIRS: RipplePair[] = [
  { cause: "Change one word,", effect: "every scene follows." },
  { cause: "Swap the color,", effect: "every shot repaints." },
  { cause: "Change your mind,", effect: "render it again." },
];

const ENTER = 18;
const EXIT = 10;
const HANDOFF = 6;
export const LAG = 14;
const COOL = 18;
const PAIR_MOTION = 56;
const TAIL = 34;

/** The pairs to show; an empty list falls back to the defaults. */
export function pairsOf(pairs: RipplePair[]) {
  return pairs.length > 0 ? pairs : DEFAULT_PAIRS;
}

// `pair:<k>` lasts until the next pair starts; the pairs are a chain and
// the last one lasts its own motion. Its words enter over `enter` frames,
// later along the line the further right they sit (a measured ripple), the
// effect line `lag` frames behind the cause; every pair after the first
// waits `handoff` more. Its words leave over `exit` frames from the next
// pair's start, and a word cools from the accent over `cool` frames.
export const editRippleTimeline = defineTimeline<
  EditRippleElementId,
  EditRippleTimingProps
>(({ pairs = DEFAULT_PAIRS, lag = LAG }, { length }) => {
  const list = pairsOf(pairs);
  const n = list.length;
  const span = length;
  const period =
    n > 1
      ? Math.min(
          96,
          Math.max(PAIR_MOTION + 12, (span - PAIR_MOTION - TAIL) / (n - 1)),
        )
      : 0;
  return list.map(
    (p, k): TimelineElement<EditRippleElementId> => ({
      id: `pair:${k}`,
      lane: "Pairs",
      label: `${p.cause} ${p.effect}`,
      start: k * period,
      length: k < n - 1 ? period : PAIR_MOTION,
      follows: k > 0 ? `pair:${k - 1}` : undefined,
      beats: {
        enter: ENTER,
        exit: EXIT,
        handoff: HANDOFF,
        lag,
        cool: COOL,
      },
    }),
  );
});
