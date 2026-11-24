import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's body lighting up, the camera's slow push, four light bands
// sweeping the figure (the last one parks on the horizon), the chrome
// gradient fading in as it parks, then the eyebrow and the label rising in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type StudioReflectionElementId =
  | "ambient"
  | "push"
  | `band:${number}`
  | "chrome"
  | "eyebrow"
  | "label";

export interface StudioReflectionTimingProps {
  captionAt?: number;
}

// When each band starts and stops sweeping; the last one parks.
const BAND_TIMES: [number, number][] = [
  [6, 30],
  [12, 46],
  [22, 48],
  [30, 64],
];

// `band:<i>` sweeps over its length. `chrome` fades in from 16 frames before
// the parked band stops to 8 after it, and follows that band.
export const studioReflectionTimeline = defineTimeline<
  StudioReflectionElementId,
  StudioReflectionTimingProps
>(({ captionAt = 50 }) => {
  const parked = BAND_TIMES[BAND_TIMES.length - 1];
  const elements: TimelineElement<StudioReflectionElementId>[] = [
    { id: "ambient", lane: "Figure", label: "Ambient", start: 0, length: 40 },
    { id: "push", lane: "Camera", label: "Push", start: 0, length: 120 },
    ...BAND_TIMES.map(
      ([t0, t1], i): TimelineElement<StudioReflectionElementId> => ({
        id: `band:${i}`,
        lane: "Shine",
        label: i === BAND_TIMES.length - 1 ? "Parked band" : `Band ${i + 1}`,
        start: t0,
        length: t1 - t0,
      }),
    ),
    {
      id: "chrome",
      lane: "Figure",
      label: "Chrome",
      start: parked[1] - 16,
      length: 24,
      follows: `band:${BAND_TIMES.length - 1}`,
    },
    {
      id: "eyebrow",
      lane: "Caption",
      label: "Eyebrow",
      start: captionAt,
      length: 22,
    },
    {
      id: "label",
      lane: "Caption",
      label: "Label",
      start: captionAt + 6,
      length: 26,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
