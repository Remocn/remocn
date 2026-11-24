import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heat crossing the name and leaving a trail, the bloom over it, the
// eyebrow fading in, the heat settling into the letters and the tagline
// rising in word by word. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type HeatTraceElementId =
  | "pass"
  | "bloom"
  | "eyebrow"
  | "settle"
  | `word:${number}`;

export interface HeatTraceTimingProps {
  tagline?: string;
  pass?: number;
  stagger?: number;
}

export const DEFAULT_TAGLINE =
  "Launch-video scenes for Remotion. Copy, paste, render.";

/** The tagline's words, in order. */
export function taglineWords(tagline: string) {
  return tagline.split(/\s+/).filter(Boolean);
}

// `pass` moves the heat across the name; the trail brightens over `glow`, and
// the blobs fade from `fade` to `gone` frames after its end. `bloom` lifts the
// bloom to full by `peak`, holds it to `hold` and dims it by its end.
// `eyebrow` fades the eyebrow in. `settle` warms the letters; the trail dims
// by `trailOut`. `word:<i>` rises tagline word `i` in (a chain after the
// pass).
export const heatTraceTimeline = defineTimeline<
  HeatTraceElementId,
  HeatTraceTimingProps
>(({ tagline = DEFAULT_TAGLINE, pass = 56, stagger = 2 }) => {
  const elements: TimelineElement<HeatTraceElementId>[] = [
    {
      id: "pass",
      lane: "Heat",
      label: "Pass",
      start: 0,
      length: pass,
      beats: { glow: 6, fade: -6, gone: 14 },
    },
    {
      id: "bloom",
      lane: "Bloom",
      label: "Bloom",
      start: 0,
      length: 96,
      beats: { peak: 10, hold: 60 },
    },
    {
      id: "eyebrow",
      lane: "Copy",
      label: "Eyebrow",
      start: 4,
      length: 16,
    },
    {
      id: "settle",
      lane: "Heat",
      label: "Settle",
      start: 46,
      length: 44,
      follows: "pass",
      beats: { trailOut: 46 },
    },
  ];
  taglineWords(tagline).forEach((word, i) => {
    elements.push({
      id: `word:${i}`,
      lane: "Tagline",
      label: word,
      start: 58 + i * stagger,
      length: 18,
      follows: i > 0 ? `word:${i - 1}` : "pass",
    });
  });
  return elements;
});
