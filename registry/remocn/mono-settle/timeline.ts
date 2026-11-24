import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line's mono letters rising in, the settle wave that turns them into
// the sans from left to right, and the highlight taking its colour. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type MonoSettleElementId = `rise:${number}` | "settle" | "highlight";

export interface MonoSettleTimingProps {
  lines?: string[];
  settleAt?: number;
  sweep?: number;
}

export const DEFAULT_LINES = ["From your editor", "to the edit."];

const RISE_GAP = 0.9;
const RISE_LEN = 16;
const LINE_LAG = 4;
export const WAVE_AT = 36;
export const WAVE_SPAN = 26;
const MORPH_LEN = 14;
const HL_AT = 72;
const HL_LEN = 14;

/** The lines to set; an empty list falls back to one, an empty line to a space. */
export function linesOf(lines: string[]) {
  return (lines.length > 0 ? lines : ["From your editor"]).map((l) => l || " ");
}

// `rise:<li>` is line `li` rising in, a letter every `gap` beat, each over
// `rise`. `settle` is one wave across all lines: a letter settles `sweep`
// times its share of the widest line after the start, plus `lag` per line,
// over `morph` frames.
export const monoSettleTimeline = defineTimeline<
  MonoSettleElementId,
  MonoSettleTimingProps
>(({ lines = DEFAULT_LINES, settleAt = WAVE_AT, sweep = WAVE_SPAN }) => {
  const list = linesOf(lines);
  const elements: TimelineElement<MonoSettleElementId>[] = [
    ...list.map(
      (line, li): TimelineElement<MonoSettleElementId> => ({
        id: `rise:${li}`,
        lane: "Rise",
        label: line,
        start: li * LINE_LAG,
        length: Math.max(0, Array.from(line).length - 1) * RISE_GAP + RISE_LEN,
        beats: { gap: RISE_GAP, rise: RISE_LEN },
      }),
    ),
    {
      id: "settle",
      lane: "Settle",
      label: "settle",
      start: settleAt,
      length: sweep + (list.length - 1) * LINE_LAG + MORPH_LEN,
      beats: { sweep, lag: LINE_LAG, morph: MORPH_LEN },
    },
    {
      id: "highlight",
      lane: "Highlight",
      label: "highlight",
      start: HL_AT,
      length: HL_LEN,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
