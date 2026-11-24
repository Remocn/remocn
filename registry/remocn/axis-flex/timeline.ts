import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word fading in, the equalizer wave flexing its letters, each letter
// snapping to the final cut, and the second line rising in under it. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type AxisFlexElementId = "enter" | "wave" | `letter:${number}` | "line";

export interface AxisFlexTimingProps {
  word?: string;
  settleAt?: number;
  stagger?: number;
}

export const DEFAULT_WORD = "elastic";
/** Frame the letters snap to their final cut, by default. */
export const SETTLE = 84;
export const SETTLE_STAGGER = 2;

const ENTER = 10;
const WAVE_IN = 6;
const WAVE_FULL = 22;
const PERIOD = 30;
/** Frames a letter's snap spring takes to settle. */
const SNAP = 20;
const LINE_IN = SETTLE + 16;
const LINE_RISE = 20;
const LINE_SQUEEZE = 24;

// The wave runs until the first letter snaps; its `full` beat is when it
// reaches full height and `period` the length of one swing, so stretching
// it slows the wave. Each letter follows the one before; the line follows
// the first letter.
export const axisFlexTimeline = defineTimeline<
  AxisFlexElementId,
  AxisFlexTimingProps
>(({ word = DEFAULT_WORD, settleAt = SETTLE, stagger = SETTLE_STAGGER }) => {
  const chars = Array.from(word);
  const lineIn = settleAt + (LINE_IN - SETTLE);
  const elements: TimelineElement<AxisFlexElementId>[] = [
    { id: "enter", lane: "Word", label: "fade in", start: 0, length: ENTER },
    {
      id: "wave",
      lane: "Wave",
      label: "flex",
      start: WAVE_IN,
      length: Math.max(0, settleAt - WAVE_IN),
      beats: { full: WAVE_FULL - WAVE_IN, period: PERIOD },
    },
    ...chars.map(
      (ch, i): TimelineElement<AxisFlexElementId> => ({
        id: `letter:${i}`,
        lane: "Letters",
        label: ch,
        start: settleAt + i * stagger,
        length: SNAP,
        follows: i > 0 ? `letter:${i - 1}` : undefined,
      }),
    ),
    {
      id: "line",
      lane: "Line",
      label: "second line",
      start: lineIn,
      length: LINE_SQUEEZE,
      follows: chars.length > 0 ? "letter:0" : undefined,
      beats: { rise: LINE_RISE },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
