import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first word melts and drips, slumps into one pool, the new word rises
// out of the pool letter by letter, centre first, and the liquid sets into
// crisp ink. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type LiquidWordElementId = "melt" | "pool" | "rise" | "set";

export interface LiquidWordTimingProps {
  to?: string;
  meltAt?: number;
  stagger?: number;
}

export const DEFAULT_FROM = "draft";
export const DEFAULT_TO = "shipped";
/** The frame the beat sheet was written for; `meltAt` shifts all of it. */
export const MELT_AT = 12;
const STAGGER = 3;
const MELT_LEN = 26;
const HEAT_IN = 16;
const DRIP_AT = 8;
const DRIP_STEP = 3;
const DRIP_JITTER = 8;
const POOL_AT = 50;
const POOL_END = 72;
const DRIP_END = 6;
const RISE_AT = 66;
const LETTER_RISE = 20;
const POOL_CLOSE = 8;
const SET_AT = 86;
const CRISP_AT = 112;
const HEAT_OUT = 6;

// `melt` floods the old word with liquid (heat over `heat`) and lets it sag;
// letter `i`'s drips start `drip + i * dripStep` frames in, plus up to
// `dripJitter`. `pool` slumps the letters into one pool; the drips grow
// until `dripEnd` frames into it. `rise` lifts the new word's letters out of
// the pool, centre first, `stagger` apart, each over `letter`; the pool
// closes from `poolClose`. `set` cools the liquid to crisp ink; the heat
// fades from `heatOut`. Each follows the one before.
export const liquidWordTimeline = defineTimeline<
  LiquidWordElementId,
  LiquidWordTimingProps
>(
  ({
    to = DEFAULT_TO,
    meltAt = MELT_AT,
    stagger = STAGGER,
  }): TimelineElement<LiquidWordElementId>[] => {
    const shift = meltAt - MELT_AT;
    const nB = Array.from(to).length;
    const reach = nB > 0 ? ((nB - 1) / 2) * stagger : 0;
    return [
      {
        id: "melt",
        lane: "Liquid",
        label: "melt",
        start: MELT_AT + shift,
        length: MELT_LEN,
        beats: {
          heat: HEAT_IN,
          drip: DRIP_AT,
          dripStep: DRIP_STEP,
          dripJitter: DRIP_JITTER,
        },
      },
      {
        id: "pool",
        lane: "Liquid",
        label: "pool",
        start: POOL_AT + shift,
        length: POOL_END - POOL_AT,
        follows: "melt",
        beats: { dripEnd: DRIP_END },
      },
      {
        id: "rise",
        lane: "Word",
        label: to,
        start: RISE_AT + shift,
        length: reach + LETTER_RISE,
        follows: "pool",
        beats: { stagger, letter: LETTER_RISE, poolClose: POOL_CLOSE },
      },
      {
        id: "set",
        lane: "Liquid",
        label: "set",
        start: SET_AT + shift,
        length: CRISP_AT - SET_AT,
        follows: "rise",
        beats: { heatOut: HEAT_OUT },
      },
    ];
  },
);
