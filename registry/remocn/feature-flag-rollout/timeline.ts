import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The flag's page rising in with its guardrail charts, the cursor clicking
// the flag on to the first step, then dragging the rollout slider to each
// next step, and the percentage pulsing once the rollout is done while the
// cursor leaves. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type FeatureFlagRolloutElementId =
  | "app"
  | "header"
  | "stage"
  | `metric:${number}`
  | "cursor"
  | "toggle"
  | `drag:${number}`
  | "done";

export interface FeatureFlagRolloutTimingProps {
  steps?: readonly number[];
  metrics?: readonly { label: string }[];
  stepGap?: number;
}

export const DEFAULT_STEPS = [5, 25, 100];
/** Labels of the default guardrails (`DEFAULT_METRICS` in the component). */
const METRIC_LABELS = [{ label: "Error rate" }, { label: "p95 latency" }];

const TOGGLE = 30;
const FIRST_GRAB = 62;
const STEP_GAP = 48;
const RELEASE = 22;

// `app` rises the window in on a spring, fading over `fade`; the camera
// pushes in from `camera` until `camEnd` after `done` starts. `header` and
// `stage` fade the page in; `metric:<i>` slides guardrail i in, a chain.
// `cursor` fades the cursor in and sends it to the toggle. `toggle` is the
// click: pressed from `press`, on at `on` (the chart marker), the rollout
// filling to the first step from `fill` and its audit row landing at `row`.
// `drag:<k>` drags the slider to step k + 1: the cursor sets off at `reach`
// and grabs at `hold`, the slider moves from `move` and is released at the
// end, its audit row landing `rowAfter` later and the cursor looking away
// `lookAfter` later; a chain after the toggle. `done` pulses the percentage,
// settling at `settle`, and the cursor fades from `leave` to `leaveEnd`.
export const featureFlagRolloutTimeline = defineTimeline<
  FeatureFlagRolloutElementId,
  FeatureFlagRolloutTimingProps
>(({ steps = DEFAULT_STEPS, metrics = METRIC_LABELS, stepGap = STEP_GAP }) => {
  const stepList = steps.length > 0 ? steps : DEFAULT_STEPS;
  const grabs = stepList
    .slice(1)
    .map((_, k) => (k === 0 ? FIRST_GRAB : FIRST_GRAB + stepGap * k));
  const lastRelease = grabs.length ? grabs[grabs.length - 1] + RELEASE : TOGGLE;
  const elements: TimelineElement<FeatureFlagRolloutElementId>[] = [
    {
      id: "app",
      lane: "Page",
      label: "Window",
      start: 0,
      length: 10,
      beats: { fade: 10, camera: 10 },
    },
    { id: "header", lane: "Page", label: "Header", start: 4, length: 10 },
    { id: "stage", lane: "Page", label: "Page", start: 6, length: 14 },
  ];
  metrics.slice(0, 2).forEach((m, i) => {
    elements.push({
      id: `metric:${i}`,
      lane: "Guardrails",
      label: m.label,
      start: 8 + i * 4,
      length: 12,
      follows: i > 0 ? `metric:${i - 1}` : undefined,
    });
  });
  elements.push(
    { id: "cursor", lane: "Cursor", label: "Cursor", start: 10, length: 6 },
    {
      id: "toggle",
      lane: "Rollout",
      label: `${stepList[0]}%`,
      start: TOGGLE,
      length: FIRST_GRAB - TOGGLE,
      beats: { press: -3, on: 2, fill: 4, row: 6 },
    },
  );
  grabs.forEach((grab, k) => {
    elements.push({
      id: `drag:${k}`,
      lane: "Rollout",
      label: `${stepList[k + 1]}%`,
      start: grab,
      length: RELEASE,
      follows: k > 0 ? `drag:${k - 1}` : "toggle",
      beats: { reach: -14, hold: -2, move: 3, rowAfter: 2, lookAfter: 4 },
    });
  });
  elements.push({
    id: "done",
    lane: "Rollout",
    label: "Done",
    start: lastRelease + 2,
    length: 12,
    follows: grabs.length ? `drag:${grabs.length - 1}` : "toggle",
    beats: { settle: 6, leave: 38, leaveEnd: 46, camEnd: 48 },
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
