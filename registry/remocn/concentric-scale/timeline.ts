import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The centre dot with the first value, each ring opening out and pushing the
// view back, then the final ring sweeping its disc and the hero figure
// landing beside it. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ConcentricScaleElementId =
  | "center"
  | `ring:${number}`
  | "final"
  | "hit";

export interface ConcentricScaleTimingProps {
  steps?: { value: string; label?: string }[];
  /** Frames between one ring and the next. */
  beat?: number;
}

export const DEFAULT_STEPS = [
  { value: "1" },
  { value: "10" },
  { value: "1,000" },
  { value: "100,000", label: "creators" },
];
export const STEP = 30;
const FIRST = 18;
const SWEEP = 30;

/** The steps drawn: at most seven, the defaults when there are fewer than two. */
export function stepsOf<T extends { value: string }>(
  steps: T[],
  fallback: T[],
): T[] {
  return steps.length >= 2 ? steps.slice(0, 7) : fallback;
}

// `center` pops the centre dot in; its value fades in from `labelAt` over
// `label`. `ring:<k>` opens ring `k`, lasting until the next ring (a chain):
// it fades in over `fade` and grows out over `grow`, its beads pop from
// `beadsAt` (each until `beadsEnd`, staggered), its value fades in from
// `labelAt` to `labelEnd`, and the view zooms back from `zoomAt` to
// `zoomEnd`. `final` sweeps the last ring's disc over its length; from it the
// view zooms back from `zoomAt`, pans over from `panAt` and the newest ring
// settles over `settle`. `hit` (following the sweep) lands the hero: the
// leader line draws from `lead` to `leadEnd`, the figure from `heroAt` to
// `heroEnd`, its label from `subAt` to `subEnd`; the zoom ends at `zoomEnd`
// and the pan at `panEnd`.
export const concentricScaleTimeline = defineTimeline<
  ConcentricScaleElementId,
  ConcentricScaleTimingProps
>(({ steps = DEFAULT_STEPS, beat = STEP }) => {
  const list = stepsOf(steps, DEFAULT_STEPS);
  const last = list.length - 1;
  const startOf = (k: number) => FIRST + (k - 1) * beat;
  const T_FINAL = startOf(last);
  const HIT = T_FINAL + SWEEP;

  const elements: TimelineElement<ConcentricScaleElementId>[] = [
    {
      id: "center",
      lane: "Rings",
      label: list[0].value,
      start: 2,
      length: 14,
      beats: { labelAt: 4, label: 14 },
    },
  ];
  for (let k = 1; k < last; k++) {
    elements.push({
      id: `ring:${k}`,
      lane: "Rings",
      label: list[k].value,
      start: startOf(k),
      length: beat,
      follows: k > 1 ? `ring:${k - 1}` : undefined,
      beats: {
        fade: 8,
        grow: 28,
        beadsAt: 4,
        beadsEnd: 12,
        labelAt: 10,
        labelEnd: 26,
        zoomAt: 12,
        zoomEnd: 40,
      },
    });
  }
  elements.push(
    {
      id: "final",
      lane: "Final",
      label: list[last].value,
      start: T_FINAL,
      length: SWEEP,
      follows: last > 1 ? `ring:${last - 1}` : undefined,
      beats: { zoomAt: 8, panAt: 16, settle: 20 },
    },
    {
      id: "hit",
      lane: "Final",
      label: list[last].label ?? list[last].value,
      start: HIT,
      length: 30,
      follows: "final",
      beats: {
        lead: -4,
        leadEnd: 12,
        heroAt: 2,
        heroEnd: 24,
        subAt: 10,
        subEnd: 30,
        zoomEnd: 22,
        panEnd: 18,
      },
    },
  );
  return elements;
});
