import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The whole screenshot settling in, the camera travelling to each stop and
// holding on it under its label, and the pull back to the full shot with
// the recap of the stops. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type ScreenshotTourElementId = "establish" | `stop:${number}` | "return";

export interface TourStop {
  /** Focus rect in screenshot pixel coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface ScreenshotTourTimingProps {
  stops?: TourStop[];
  framesPerStop?: number;
  pullBack?: boolean;
}

export const DEFAULT_STOPS: TourStop[] = [
  {
    x: 240,
    y: 63,
    width: 660,
    height: 182,
    label: "Every issue, grouped by status",
  },
  {
    x: 1004,
    y: 99,
    width: 412,
    height: 146,
    label: "Labels, owners and due dates",
  },
  {
    x: 8,
    y: 244,
    width: 216,
    height: 172,
    label: "Each team gets its own space",
  },
];

const ESTABLISH = 18;
const RETURN = 24;
/** The label pops in this long before the camera arrives. */
const ARRIVE_LEAD = 5;
const RECAP_AT = 4;
const RECAP_GAP = 3;

// `stop:<i>` is a chain: the camera travels over `travel`, its label
// arrives at `arrive`, and the camera drifts in for the rest of the stop.
// `return` (only with `pullBack`) follows the last stop; the recap lines
// come in from `recap`, `recapGap` apart.
export const screenshotTourTimeline = defineTimeline<
  ScreenshotTourElementId,
  ScreenshotTourTimingProps
>(({ stops = DEFAULT_STOPS, framesPerStop = 45, pullBack = true }) => {
  const n = stops.length;
  const F = framesPerStop;
  const T = Math.round(Math.min(20, F * 0.45));
  const tourEnd = ESTABLISH + n * F;
  const elements: TimelineElement<ScreenshotTourElementId>[] = [
    {
      id: "establish",
      lane: "Camera",
      label: "establish",
      start: 0,
      length: ESTABLISH,
    },
    ...stops.map(
      (stop, i): TimelineElement<ScreenshotTourElementId> => ({
        id: `stop:${i}`,
        lane: "Camera",
        label: stop.label,
        start: ESTABLISH + i * F,
        length: F,
        follows: i > 0 ? `stop:${i - 1}` : "establish",
        beats: { travel: T, arrive: T - ARRIVE_LEAD },
      }),
    ),
  ];
  if (pullBack) {
    elements.push({
      id: "return",
      lane: "Camera",
      label: "pull back",
      start: tourEnd,
      length: RETURN,
      follows: n > 0 ? `stop:${n - 1}` : "establish",
      beats: { recap: RECAP_AT, recapGap: RECAP_GAP },
    });
  }
  return elements;
});
