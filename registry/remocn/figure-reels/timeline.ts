import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure rolling up from `from` in a few steps while the image reels
// spin in, the last digit carrying over to `to` in the accent, the camera
// pulling back from the figure, the label and logo landing, the accent
// fading and the reels stepping one card on. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FigureReelsElementId =
  | `step:${number}`
  | "reels"
  | "carry"
  | "pull"
  | "label"
  | "fade"
  | "advance";

export interface FigureReelsTimingProps {
  from?: number;
  to?: number;
}

export const DEFAULT_FROM = 396;
export const DEFAULT_TO = 400;

const STEPS = [[8], [-3, 17], [-3, 11, 23], [-3, 9, 19, 27]];
const STEP_LEN = 7;
const CARRY = 40;
const CARRY_STEP = 2;
const PULL = 48;
const REEL_START = 22;
const REEL_LAG = 3;
const LABEL = 69;
const ACCENT_OUT = 96;
const ADVANCE = 100;

/** How the figure rolls from `from` to one below `to`: the steps and their sizes. */
export function rollPlan(from: number, to: number) {
  const target = Math.max(1, Math.round(to));
  const start = Math.max(0, Math.min(target - 1, Math.round(from)));
  const range = target - 1 - start;
  const nSteps = Math.min(STEPS.length, range);
  const weights = [0.5, 0.25, 0.15, 0.1].slice(0, nSteps);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const deltas: number[] = [];
  let left = range;
  for (let i = 0; i < nSteps; i++) {
    const d =
      i === nSteps - 1
        ? left
        : range <= STEPS.length
          ? 1
          : Math.max(1, Math.round((range * weights[i]) / wSum));
    deltas.push(d);
    left -= d;
  }
  const stepStarts = STEPS[Math.max(0, nSteps - 1)];
  return { target, start, nSteps, deltas, stepStarts };
}

// `step:<i>` rolls the figure by its share of the range over its length (a
// chain). `reels` spin the image reels in, the bottom one `lag` behind.
// `carry` rolls the last unit into `to`, one digit column `digitStep` after
// the other, and tints the figure in the accent over `tint`. `pull` springs
// the camera back from the figure. `label` slides the label in over its
// length; the logo springs from `logo` (before the start). `fade` takes the
// accent back out, and `advance` springs the reels one card on.
export const figureReelsTimeline = defineTimeline<
  FigureReelsElementId,
  FigureReelsTimingProps
>(({ from = DEFAULT_FROM, to = DEFAULT_TO }) => {
  const plan = rollPlan(from, to);
  const elements: TimelineElement<FigureReelsElementId>[] = [];
  for (let i = 0; i < plan.nSteps; i++) {
    elements.push({
      id: `step:${i}`,
      lane: "Figure",
      label: `+${plan.deltas[i]}`,
      start: plan.stepStarts[i],
      length: STEP_LEN,
      follows: i > 0 ? `step:${i - 1}` : undefined,
    });
  }
  elements.push(
    {
      id: "reels",
      lane: "Reels",
      label: "Reels",
      start: REEL_START,
      length: CARRY - REEL_START,
      beats: { lag: REEL_LAG },
    },
    {
      id: "carry",
      lane: "Figure",
      label: String(plan.target),
      start: CARRY,
      length: PULL - CARRY,
      beats: { digitStep: CARRY_STEP, tint: 6 },
    },
    {
      id: "pull",
      lane: "Camera",
      label: "Pull back",
      start: PULL,
      length: LABEL - PULL,
    },
    {
      id: "label",
      lane: "Label",
      label: "Label",
      start: LABEL,
      length: 15,
      beats: { logo: -3 },
    },
    {
      id: "fade",
      lane: "Figure",
      label: "Accent out",
      start: ACCENT_OUT,
      length: 18,
    },
    {
      id: "advance",
      lane: "Reels",
      label: "Step",
      start: ADVANCE,
      length: 20,
    },
  );
  // The roll's later steps can land after the reels start.
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
