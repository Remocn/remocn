import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The baseline drawing, the columns filling pixel by pixel one after
// another (the last, the hero, accelerating past the previous best), the
// reference line, the metric arriving and counting up, the camera sliding
// over to it, and the label. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type PixelBarsElementId =
  | "base"
  | "push"
  | `column:${number}`
  | "slide"
  | "count"
  | "reference"
  | "number"
  | "label";

export interface PixelBarsTimingProps {
  values?: number[];
  /** Frames between one column starting and the next. */
  stagger?: number;
  /** Pixel rows in the tallest column; more rows make smaller pixels. */
  rows?: number;
}

export const DEFAULT_VALUES = [31, 38, 35, 44, 41, 50, 84];
const START = 6;
export const COL_STAGGER = 5;
const PIXEL_STEP = 1.6;
const POP_DUR = 4;
const LEAD = 6;
/** Frames² the hero column's pixels slow by past the previous best. */
const ACCEL = 0.14;

/** Each column's height in pixel rows, the tallest `maxRows`. */
export function columnHeights(values: number[], maxRows: number) {
  const list = values.length ? values.slice(0, 16) : DEFAULT_VALUES;
  const maxV = Math.max(...list.map((v) => Math.max(0, v)), 1);
  return list.map((v) =>
    Math.max(1, Math.round((Math.max(0, v) / maxV) * maxRows)),
  );
}

// `base` draws the baseline; `push` is the camera easing out of its push.
// `column:<i>` is column `i` filling, a pixel row every `step` frames, each
// popping over `pop`, lit over `on`, with a lead colour fading over `lead`;
// its empty slots fade in from `slotIn` to `slotOut`. The hero (last) column
// slows by `accel` past the previous best. The columns chain. `slide`,
// `count`, `reference` and `number` hang on the moment the hero passes the
// previous best; `label` follows the hero column.
export const pixelBarsTimeline = defineTimeline<
  PixelBarsElementId,
  PixelBarsTimingProps
>(({ values = DEFAULT_VALUES, stagger = COL_STAGGER, rows = 14 }) => {
  const heights = columnHeights(values, rows);
  const last = heights.length - 1;
  const prevMax = Math.max(1, ...heights.slice(0, last));
  const colStart = (i: number) => START + i * stagger;
  const pixelTime = (i: number, k: number) => {
    if (i !== last || k < prevMax) return colStart(i) + k * PIXEL_STEP;
    const extra = k - prevMax;
    return (
      colStart(i) +
      prevMax * PIXEL_STEP +
      extra * PIXEL_STEP * 1.3 +
      extra * extra * ACCEL
    );
  };
  const finish = pixelTime(last, heights[last] - 1) + POP_DUR;
  const passAt = pixelTime(last, prevMax);
  const out: TimelineElement<PixelBarsElementId>[] = [
    { id: "base", lane: "Chart", label: "baseline", start: 0, length: 14 },
    {
      id: "push",
      lane: "Camera",
      label: "push",
      start: 0,
      length: finish + 30,
    },
  ];
  heights.forEach((h, i) => {
    out.push({
      id: `column:${i}`,
      lane: "Columns",
      label: `column ${i + 1}`,
      start: colStart(i),
      // Written so that the hero's `start + length` is `finish` to the last bit.
      length:
        i === last
          ? finish - colStart(i)
          : pixelTime(i, h - 1) - colStart(i) + POP_DUR,
      follows: i > 0 ? `column:${i - 1}` : undefined,
      beats: {
        step: PIXEL_STEP,
        accel: ACCEL,
        pop: POP_DUR,
        on: 2,
        lead: LEAD,
        slotIn: -6,
        slotOut: 2,
      },
    });
  });
  out.push(
    {
      id: "slide",
      lane: "Camera",
      label: "slide",
      start: passAt - 10,
      length: finish + 8 - (passAt - 10),
    },
    {
      id: "count",
      lane: "Metric",
      label: "count",
      start: passAt - 6,
      length: finish + 2 - (passAt - 6),
    },
    {
      id: "reference",
      lane: "Chart",
      label: "reference",
      start: passAt - 4,
      length: 12,
    },
    {
      id: "number",
      lane: "Metric",
      label: "number",
      start: passAt - 2,
      length: 8,
    },
    {
      id: "label",
      lane: "Metric",
      label: "label",
      start: finish,
      length: 14,
      follows: `column:${last}`,
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
