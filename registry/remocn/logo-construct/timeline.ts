import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The R is constructed on blueprint paper: the grid fades up, guides grow
// out of the mark, the compass, ruler, leg and bezier handles do their work,
// the outline draws and the fill sweeps round the bowl. Then the camera
// pulls back and the name rises letter by letter onto the shared baseline.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type LogoConstructElementId =
  | "drift"
  | "grid"
  | "guides"
  | "compass"
  | "ruler"
  | "leg"
  | "handles"
  | "outline"
  | "fill"
  | "logo"
  | "settle"
  | "pull"
  | "word-guides"
  | `letter:${number}`
  | "hold"
  | "word-settle";

export interface LogoConstructTimingProps {
  name?: string;
  stagger?: number;
}

export const DEFAULT_NAME = "emocn";
const STAGGER = 3;

export const logoConstructTimeline = defineTimeline<
  LogoConstructElementId,
  LogoConstructTimingProps
>(({ name = DEFAULT_NAME, stagger = STAGGER }) => {
  const elements: TimelineElement<LogoConstructElementId>[] = [
    // The camera creeps in on the R while it is constructed.
    { id: "drift", lane: "Camera", label: "Drift", start: 0, length: 120 },
    { id: "grid", lane: "Paper", label: "Grid", start: 0, length: 18 },
    // Each guide starts a few frames after the one before (offsets in the
    // component) and grows over `grow`.
    {
      id: "guides",
      lane: "Guides",
      label: "Guides",
      start: 8,
      length: 43,
      beats: { grow: 26 },
    },
    {
      id: "compass",
      lane: "Construction",
      label: "Compass",
      start: 28,
      length: 38,
      beats: {
        cross: 12,
        radiusAt: 4,
        radius: 14,
        outerAt: 8,
        outer: 30,
        quadrantAt: 18,
        quadrant: 14,
        innerAt: 20,
        inner: 16,
      },
    },
    {
      id: "ruler",
      lane: "Dimensions",
      label: "Ruler",
      start: 40,
      length: 24,
      beats: { dimsAt: 4, dims: 16 },
    },
    {
      id: "leg",
      lane: "Construction",
      label: "Leg",
      start: 54,
      length: 22,
      beats: { axis: 18, arcAt: 6, arc: 16 },
    },
    {
      id: "handles",
      lane: "Handles",
      label: "Bezier handles",
      start: 58,
      length: 27,
      beats: { draw: 12, stagger: 3 },
    },
    { id: "outline", lane: "Mark", label: "Outline", start: 72, length: 34 },
    // The fill sweeps round the bowl; once it is solid the outline fades.
    {
      id: "fill",
      lane: "Mark",
      label: "Fill",
      start: 96,
      length: 32,
      follows: "outline",
      beats: { doneAt: 26, done: 12 },
    },
    { id: "logo", lane: "Logo", label: "Logo", start: 100, length: 26 },
    // Labels fade and the guides settle to hairlines.
    {
      id: "settle",
      lane: "Guides",
      label: "Settle",
      start: 110,
      length: 40,
      beats: { labels: 22, guidesAt: 2, guides: 38 },
    },
    {
      id: "pull",
      lane: "Camera",
      label: "Pull back",
      start: 120,
      length: 48,
      follows: "drift",
    },
    {
      id: "word-guides",
      lane: "Word guides",
      label: "x-height and baseline",
      start: 138,
      length: 36,
      beats: {
        xGrow: 28,
        guidesAt: 2,
        guides: 20,
        relightAt: 8,
        relight: 20,
        labelsAt: 18,
        labels: 18,
      },
    },
    ...name.split("").map(
      (ch, i): TimelineElement<LogoConstructElementId> => ({
        id: `letter:${i}`,
        lane: "Name",
        label: ch,
        start: 144 + i * stagger,
        length: 20,
        follows: i > 0 ? `letter:${i - 1}` : undefined,
      }),
    ),
    // A slow push on the lockup, running past the end of the default clip.
    {
      id: "hold",
      lane: "Camera",
      label: "Hold",
      start: 160,
      length: 100,
      follows: "pull",
    },
    // The baseline dims back and the word guides fade out.
    {
      id: "word-settle",
      lane: "Word guides",
      label: "Settle",
      start: 196,
      length: 36,
      beats: { fade: 34, settleAt: 2 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
