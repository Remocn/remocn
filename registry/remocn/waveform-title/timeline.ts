import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The waveform opening out, the playhead sweeping it calm and down onto the
// baseline, the line settling to the title's width, and the title rising
// word by word above it. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type WaveformTitleElementId =
  | "open"
  | "haze"
  | "sweep"
  | "settle"
  | `word:${number}`;

export interface WaveformTitleTimingProps {
  title?: string;
  /** Frames between words as the title rises. */
  stagger?: number;
}

export const DEFAULT_TITLE = "Your voice, captioned";
const OPEN = 16;
const HAZE = 30;
const SWEEP_AT = 40;
const SWEEP_END = 82;
/** The playhead fades in over `HEAD_IN`, out from `HEAD_OUT` to `HEAD_GONE`. */
const HEAD_IN = 6;
const HEAD_OUT = 36;
const HEAD_GONE = 44;
const SETTLE_END = 104;
const RISE = 84;
const STAGGER = 4;
const WORD = 22;

// `sweep` carries the playhead across (its fades are beats); at `settle` the
// waveform hands off to the line under the title. `word:<i>` rises over its
// length, each word following the one before.
export const waveformTitleTimeline = defineTimeline<
  WaveformTitleElementId,
  WaveformTitleTimingProps
>(({ title = DEFAULT_TITLE, stagger = STAGGER }) => {
  const elements: TimelineElement<WaveformTitleElementId>[] = [
    { id: "open", lane: "Wave", label: "open", start: 0, length: OPEN },
    { id: "haze", lane: "Haze", label: "haze", start: 0, length: HAZE },
    {
      id: "sweep",
      lane: "Wave",
      label: "sweep",
      start: SWEEP_AT,
      length: SWEEP_END - SWEEP_AT,
      follows: "open",
      beats: { headIn: HEAD_IN, headOut: HEAD_OUT, headGone: HEAD_GONE },
    },
    {
      id: "settle",
      lane: "Wave",
      label: "settle",
      start: SWEEP_END,
      length: SETTLE_END - SWEEP_END,
      follows: "sweep",
    },
  ];
  title.split(" ").forEach((w, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Title",
      label: w,
      start: RISE + i * stagger,
      length: WORD,
      follows: i > 0 ? `word:${i - 1}` : "sweep",
    });
  });
  return elements;
});
