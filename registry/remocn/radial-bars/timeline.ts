import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dial fading up while it turns into place and the camera eases in,
// the inner ring drawing, the tick labels, the bars sweeping in around the
// dial, then the focus on the peak group, its bracket, the figure counting
// up and the caption. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type RadialBarsElementId =
  | "stage"
  | "spin"
  | "zoom"
  | "ring"
  | "sweep"
  | "ticks"
  | "focus"
  | "bracket"
  | "figure"
  | "caption";

export interface RadialBarsTimingProps {
  values?: number[];
  sweep?: number;
}

/** Bars in the default data. */
export const DEFAULT_BARS = 60;

const GROW = 22;
const START = 6;

// `sweep` starts a bar every `step` frames, each growing over `grow` and
// fading in from `showFrom` to `show` around its start. The focus lands 2
// frames after the last bar has grown and follows the sweep; the bracket,
// the figure (it lands over `land`) and the caption follow the focus.
export const radialBarsTimeline = defineTimeline<
  RadialBarsElementId,
  RadialBarsTimingProps
>(({ values, sweep = 54 }) => {
  const n = values?.length ? values.length : DEFAULT_BARS;
  const SWEEP = sweep;
  const step = n > 1 ? SWEEP / (n - 1) : 0;
  const HIT = START + SWEEP + GROW + 2;
  const elements: TimelineElement<RadialBarsElementId>[] = [
    { id: "stage", lane: "Dial", label: "Fade up", start: 0, length: 10 },
    { id: "spin", lane: "Camera", label: "Turn", start: 0, length: HIT + 6 },
    { id: "zoom", lane: "Camera", label: "Zoom", start: 0, length: HIT + 50 },
    { id: "ring", lane: "Dial", label: "Ring", start: 0, length: 26 },
    {
      id: "sweep",
      lane: "Bars",
      label: "Sweep",
      start: START,
      length: SWEEP + GROW,
      beats: { step, grow: GROW, showFrom: -2, show: 3 },
    },
    { id: "ticks", lane: "Dial", label: "Ticks", start: 10, length: 24 },
    {
      id: "focus",
      lane: "Bars",
      label: "Focus",
      start: HIT,
      length: 16,
      follows: "sweep",
    },
    {
      id: "bracket",
      lane: "Bars",
      label: "Bracket",
      start: HIT + 6,
      length: 18,
      follows: "focus",
    },
    {
      id: "figure",
      lane: "Figure",
      label: "Figure",
      start: HIT + 6,
      length: 26,
      follows: "focus",
      beats: { land: 20 },
    },
    {
      id: "caption",
      lane: "Figure",
      label: "Caption",
      start: HIT + 14,
      length: 18,
      follows: "focus",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
