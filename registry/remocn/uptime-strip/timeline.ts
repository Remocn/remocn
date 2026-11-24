import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The scene fading up under a slow push, the axis captions, the scan front
// sweeping the days in, the strip gliding down while its bars settle into
// the gradient and the gradient drifts, then the figure and its label
// rising letter by letter. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type UptimeStripElementId =
  | "stage"
  | "push"
  | "ago"
  | "sweep"
  | "today"
  | "glide"
  | "settle"
  | "drift"
  | "value"
  | "label";

export interface UptimeStripTimingProps {
  value?: string;
  label?: string;
  stagger?: number;
}

const SWEEP_START = 6;
const SWEEP_LEN = 34;
const GROW = 12;
const SETTLE = 54;
const SETTLE_SPREAD = 16;
const LAND = 60;
const RISE = 22;

// `sweep` moves the scan front across the strip: each bar starts growing
// (`grow`) and flashes (peak at `flash`, gone at `fade`) as the front passes
// it, and the scan line fades in over `scanIn` and out over `scanOut` after
// the sweep. `settle` spreads each bar's settle over `spread`, each taking
// `each`. `value` and `label` rise one character every `stagger` frames,
// each over `rise`; the label follows the value, the today caption follows
// the sweep.
export const uptimeStripTimeline = defineTimeline<
  UptimeStripElementId,
  UptimeStripTimingProps
>(
  ({
    value = "99.99%",
    label = "uptime",
    stagger = 2,
  }): TimelineElement<UptimeStripElementId>[] => {
    const valueChars = Array.from(value).length;
    const labelChars = Array.from(label).length;
    const wordStart = LAND + valueChars * stagger + 4;
    return [
      { id: "stage", lane: "Scene", label: "fade up", start: 0, length: 8 },
      { id: "push", lane: "Camera", label: "push", start: 0, length: 130 },
      { id: "ago", lane: "Captions", label: "days ago", start: 4, length: 14 },
      {
        id: "sweep",
        lane: "Strip",
        label: "sweep",
        start: SWEEP_START,
        length: SWEEP_LEN,
        beats: { grow: GROW, flash: 2, fade: 16, scanIn: 4, scanOut: 10 },
      },
      {
        id: "today",
        lane: "Captions",
        label: "today",
        start: SWEEP_START + SWEEP_LEN - 4,
        length: 14,
        follows: "sweep",
      },
      {
        id: "glide",
        lane: "Strip",
        label: "glide down",
        start: SETTLE - 6,
        length: 32,
      },
      {
        id: "settle",
        lane: "Bars",
        label: "settle",
        start: SETTLE,
        length: SETTLE_SPREAD + 10,
        beats: { spread: SETTLE_SPREAD, each: 10 },
      },
      {
        id: "drift",
        lane: "Gradient",
        label: "gradient drift",
        start: SETTLE,
        length: 130 - SETTLE,
      },
      {
        id: "value",
        lane: "Figure",
        label: value,
        start: LAND,
        length: Math.max(0, valueChars - 1) * stagger + RISE,
        beats: { stagger, rise: RISE },
      },
      {
        id: "label",
        lane: "Figure",
        label,
        start: wordStart,
        length: Math.max(0, labelChars - 1) + RISE,
        follows: "value",
        beats: { stagger: 1, rise: RISE },
      },
    ];
  },
);
