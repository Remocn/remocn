import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Beat sheet (30fps, speed 1):
//   0–48   eight small candles chop sideways, one every 5 frames
//  50–82   the rally: five green candles, 6 frames apart, each bigger
//  82–108  the last candle pushes up huge and fills with the aurora gradient;
//          the price tag rides its wick and breaks the dashed previous high
// 110–126  ALL-TIME / HIGH slams in, the candles fall back behind it
// 126–     poster holds
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type CandleRallyElementId =
  | "camera"
  | "level"
  | `candle:${number}`
  | "breakout"
  | "slam";

/** Chop candles, then rally candles; the breakout candle comes after them. */
const CHOP_COUNT = 8;
const RALLY_COUNT = 5;
const RALLY_AT = 50;
const FINAL_AT = 82;
const FINAL_LEN = 26;
const SLAM = 110;

// `level` draws the axis and the dashed previous high. `camera` pulls back
// from its start, reaching the rally framing at `pullAt` and the wide
// framing at its end. `candle:<i>` grows candle `i`
// (the chop, then the rally) over its length, fading in over `appear`; a
// chain. `breakout` pushes the last candle up over its length: its aurora
// fills from `gradAt` to the end, the ground glows until `glow` past the
// end, the price tag slides in from `tagAt` to `tagEnd`. `slam` lands the
// first headline line over `line`, the second `gap` later, dims the chart
// over `dim` and dips it from `hitAt` to `hitPeak` and back by its end.
export const candleRallyTimeline = defineTimeline<CandleRallyElementId, object>(
  () => {
    const candles = CHOP_COUNT + RALLY_COUNT;
    const elements: TimelineElement<CandleRallyElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "Pull back",
        start: 0,
        length: FINAL_AT + 16,
        beats: { pullAt: RALLY_AT - 4 },
      },
      {
        id: "level",
        lane: "Level",
        label: "Previous high",
        start: 6,
        length: 16,
      },
      ...Array.from(
        { length: candles },
        (_, i): TimelineElement<CandleRallyElementId> => ({
          id: `candle:${i}`,
          lane: "Candles",
          label:
            i < CHOP_COUNT ? `Chop ${i + 1}` : `Rally ${i - CHOP_COUNT + 1}`,
          start: i < CHOP_COUNT ? 4 + i * 5 : RALLY_AT + (i - CHOP_COUNT) * 6,
          length: i < CHOP_COUNT ? 8 : 9 + (i - CHOP_COUNT),
          follows: i > 0 ? `candle:${i - 1}` : undefined,
          beats: { appear: 2 },
        }),
      ),
      {
        id: "breakout",
        lane: "Candles",
        label: "Breakout",
        start: FINAL_AT,
        length: FINAL_LEN,
        follows: `candle:${candles - 1}`,
        beats: { appear: 2, gradAt: 6, glow: 10, tagAt: 2, tagEnd: 10 },
      },
      {
        id: "slam",
        lane: "Headline",
        label: "Slam",
        start: SLAM,
        length: 16,
        follows: "breakout",
        beats: { line: 7, gap: 4, dim: 12, hitAt: 1, hitPeak: 3 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
