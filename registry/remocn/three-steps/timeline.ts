import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The eyebrow and the rail drawing in, the dot travelling from step to step
// and filling each node as it arrives, then the ring on the last step. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type ThreeStepsElementId =
  | "eyebrow"
  | "line"
  | `step:${number}`
  | "ring";

export interface ThreeStepsTimingProps {
  steps?: { title: string; detail?: string }[];
  /** Frames the dot takes to travel from one step to the next. */
  travel?: number;
  /** Frames the dot rests on each step. */
  pause?: number;
}

export const DEFAULT_STEPS = [
  { title: "Install", detail: "Add a component with the shadcn CLI" },
  { title: "Compose", detail: "Arrange scenes in plain React" },
  { title: "Render", detail: "Export MP4 from Remotion" },
];
export const LINE_START = 2;
export const LINE_DUR = 26;
export const FIRST_FILL = 26;
export const TRAVEL = 18;
export const PAUSE = 10;
const EYEBROW_AT = 8;
const EYEBROW = 18;
/** The dot fades in this long before the first node fills. */
const DOT_IN = 8;
/** A node fills over `FILL`; its text starts `TEXT_AT` after. */
const FILL = 8;
const TEXT_AT = 2;
const RING = 26;
const DOT_OUT = 4;
/** The camera push eases out until this long after the last step fills. */
const PUSH = 60;

// A step starts when the dot arrives and its node fills. `arrive` (negative)
// is when the dot sets off towards it: the travel from the step before, or
// the dot fading in for the first.
export const threeStepsTimeline = defineTimeline<
  ThreeStepsElementId,
  ThreeStepsTimingProps
>(({ steps = DEFAULT_STEPS, travel = TRAVEL, pause = PAUSE }) => {
  const n = Math.max(1, steps.length);
  const fillAt = (i: number) => FIRST_FILL + i * (travel + pause);
  const done = fillAt(n - 1);
  const elements: TimelineElement<ThreeStepsElementId>[] = [
    {
      id: "line",
      lane: "Rail",
      label: "rail",
      start: LINE_START,
      length: LINE_DUR,
    },
    {
      id: "eyebrow",
      lane: "Eyebrow",
      label: "eyebrow",
      start: EYEBROW_AT,
      length: EYEBROW,
    },
    ...Array.from(
      { length: n },
      (_, i): TimelineElement<ThreeStepsElementId> => ({
        id: `step:${i}`,
        lane: "Steps",
        label: steps[i]?.title ?? "",
        start: fillAt(i),
        length: i + 1 < n ? travel + pause : RING,
        follows: i > 0 ? `step:${i - 1}` : "line",
        beats: {
          arrive: i > 0 ? -travel : -DOT_IN,
          fill: FILL,
          text: TEXT_AT,
        },
      }),
    ),
    {
      id: "ring",
      lane: "Ring",
      label: "ring",
      start: done,
      length: RING,
      follows: `step:${n - 1}`,
      beats: { dotOut: DOT_OUT, push: PUSH },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
