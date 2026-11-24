import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The eyebrow fading in, the camera's push, the coarsest grid filling in
// left to right, each sharpening step to a finer grid (the last one swaps
// the grid for crisp type) and the label rising in. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type ResClimbElementId =
  | "eyebrow"
  | "build"
  | "push"
  | `snap:${number}`
  | "label";

export interface ResClimbTimingProps {
  steps?: number[];
  snapAt?: number;
  build?: number;
}

export const BUILD = 12;
export const FIRST_SNAP = 28;
const SNAP_GAPS = [10, 8, 6, 5];
export const DEFAULT_STEPS = [7, 14, 28];

/** The grid sizes to climb through: at most four, the default when empty. */
export function stepsOf(steps: number[]) {
  return steps.length ? steps.slice(0, 4) : DEFAULT_STEPS;
}

// `build` fills the coarsest grid's columns left to right over its length,
// a third of it already done at frame 0. `snap:<i>` switches to grid i + 1;
// the last snap switches to crisp type, with the haze rising from
// `hazeFrom` to its end. Each snap follows the one before; `label` follows
// the last.
export const resClimbTimeline = defineTimeline<
  ResClimbElementId,
  ResClimbTimingProps
>(({ steps = DEFAULT_STEPS, snapAt = FIRST_SNAP, build = BUILD }) => {
  const count = stepsOf(steps).length;
  const snaps: number[] = [];
  for (let i = 0; i < count; i++)
    snaps.push(i === 0 ? snapAt : snaps[i - 1] + SNAP_GAPS[i - 1]);
  const crispAt = snaps[snaps.length - 1];
  const last = count - 1;
  const elements: TimelineElement<ResClimbElementId>[] = [
    { id: "eyebrow", lane: "Copy", label: "Eyebrow", start: -6, length: 18 },
    {
      id: "build",
      lane: "Figure",
      label: "Build",
      start: -(build * 0.33),
      length: build,
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: 0,
      length: crispAt + 30,
    },
    ...snaps.map(
      (at, i): TimelineElement<ResClimbElementId> =>
        i < last
          ? {
              id: `snap:${i}`,
              lane: "Figure",
              label: `Sharpen ${i + 1}`,
              start: at,
              length: SNAP_GAPS[i],
              follows: i > 0 ? `snap:${i - 1}` : undefined,
            }
          : {
              id: `snap:${i}`,
              lane: "Figure",
              label: "Crisp",
              start: at,
              length: 24,
              follows: i > 0 ? `snap:${i - 1}` : undefined,
              beats: { hazeFrom: -4 },
            },
    ),
    {
      id: "label",
      lane: "Copy",
      label: "Label",
      start: crispAt + 3,
      length: 20,
      follows: `snap:${last}`,
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
