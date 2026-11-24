import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera settling and the colors drifting under everything, the scan
// line stretching out, the scan painting the figure row by row (each pixel
// flashes hot and cools to its color), the line fading as the scan lands,
// then the label rising in. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type RasterPaintElementId =
  | "camera"
  | "drift"
  | "line-in"
  | "scan"
  | "line-out"
  | "label";

export interface RasterPaintTimingProps {
  scanLength?: number;
  trail?: number;
}

const LINE_IN = 2;
const SCAN_AT = 10;
export const SCAN_DUR = 58;
const SWEEP = 4;
export const TRAIL = 12;

// `scan` moves the head down the figure over its length; each row starts
// painting when the head passes it, its pixels one after another over
// `sweep`, each lighting over `on` and cooling from `coolFrom` to `cool`.
// `line-out` and `label` follow the scan.
export const rasterPaintTimeline = defineTimeline<
  RasterPaintElementId,
  RasterPaintTimingProps
>(({ scanLength = SCAN_DUR, trail = TRAIL }) => {
  const labelAt = SCAN_AT + scanLength + 6;
  const elements: TimelineElement<RasterPaintElementId>[] = [
    {
      id: "camera",
      lane: "Scene",
      label: "Camera",
      start: 0,
      length: labelAt + 30,
    },
    { id: "drift", lane: "Scene", label: "Color drift", start: 0, length: 120 },
    {
      id: "line-in",
      lane: "Line",
      label: "Line in",
      start: LINE_IN,
      length: SCAN_AT + 4 - LINE_IN,
    },
    {
      id: "scan",
      lane: "Figure",
      label: "Scan",
      start: SCAN_AT,
      length: scanLength,
      beats: { sweep: SWEEP, on: 3, coolFrom: 1, cool: trail },
    },
    {
      id: "line-out",
      lane: "Line",
      label: "Line out",
      start: SCAN_AT + scanLength - 6,
      length: 8,
      follows: "scan",
    },
    {
      id: "label",
      lane: "Label",
      label: "Label",
      start: labelAt,
      length: 16,
      follows: "scan",
    },
  ];
  return elements;
});
