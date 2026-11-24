import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The letters fading in, waves of weight rolling across the line, then the
// line settling into its final weight with the highlight tinting in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type WeightWaveElementId =
  | "enter"
  | `wave:${number}`
  | "haze"
  | "settle";

export interface WeightWaveTimingProps {
  text?: string;
  waves?: number;
  waveLength?: number;
  stagger?: number;
}

export const DEFAULT_TEXT = "Made to move.";
const WAVES = 2;
/** Letters fade in over `ENTER_LEN`, a frame apart, from `ENTER`. */
const ENTER = 4;
const ENTER_LEN = 12;
const ENTER_STAGGER = 1;
const WAVE_START = 16;
const WAVE_LEN = 46;
const WAVE_GAP = 24;
const SETTLE_STAGGER = 2.4;
/** The settle starts this long before the last wave has crossed. */
const SETTLE_LEAD = 8;
/** The highlight tints `TINT` into the settle, over `TINT_LEN`, 2 apart. */
const TINT = 14;
const TINT_LEN = 16;
const TINT_STAGGER = 2;
/** The beam sheen starts `SHEEN` in and runs `SHEEN_LEN`. */
const SHEEN = 12;
const SHEEN_LEN = 80;
/** The push runs until `PUSH` into the settle; the haze until `HAZE`. */
const PUSH = 70;
const HAZE = 40;

// The settle's spring has no fixed end; its element covers the tint.
export const weightWaveTimeline = defineTimeline<
  WeightWaveElementId,
  WeightWaveTimingProps
>(
  ({
    text = DEFAULT_TEXT,
    waves = WAVES,
    waveLength = WAVE_LEN,
    stagger = SETTLE_STAGGER,
  }) => {
    const n = Array.from(text).length;
    const settleStart =
      WAVE_START + (waves - 1) * WAVE_GAP + waveLength - SETTLE_LEAD;
    const elements: TimelineElement<WeightWaveElementId>[] = [
      {
        id: "enter",
        lane: "Letters",
        label: text,
        start: ENTER,
        length: ENTER_LEN + Math.max(0, n - 1) * ENTER_STAGGER,
        beats: { stagger: ENTER_STAGGER, letter: ENTER_LEN },
      },
      {
        id: "haze",
        lane: "Haze",
        label: "haze",
        start: WAVE_START,
        length: settleStart + HAZE - WAVE_START,
      },
    ];
    for (let k = 0; k < waves; k++) {
      elements.push({
        id: `wave:${k}`,
        lane: "Waves",
        label: `wave ${k + 1}`,
        start: WAVE_START + k * WAVE_GAP,
        length: waveLength,
        follows: k > 0 ? `wave:${k - 1}` : undefined,
      });
    }
    elements.push({
      id: "settle",
      lane: "Settle",
      label: "settle",
      start: settleStart,
      length: TINT + TINT_LEN,
      follows: waves > 0 ? `wave:${waves - 1}` : undefined,
      beats: {
        stagger,
        tint: TINT,
        tintLen: TINT_LEN,
        tintStagger: TINT_STAGGER,
        sheen: SHEEN,
        sheenLen: SHEEN_LEN,
        push: PUSH,
      },
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
