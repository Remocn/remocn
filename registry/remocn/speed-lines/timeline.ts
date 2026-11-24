import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Trail mode: the subject travels to its target and settles on a spring.
// Focus mode: the lines rush in to the focus point, hold, then release.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type SpeedLinesElementId = "travel" | "settle" | "rush" | "release";

export interface SpeedLinesTimingProps {
  mode?: string;
  duration?: number;
  bounce?: number;
}

const DURATION = 14;
const BOUNCE = 0.5;
const MIN_DURATION = 4;
const MAX_DURATION = 120;
const LANDING = 0.3;
const CARRY = 0.3;
const ECHO = 0.2;
const SOFTEN = 1.2;
const SETTLE = 6;
/** Frame the focus lines reach their rest radius. */
export const IMPACT = 3;
/** How late, at most, a focus line starts its rush. */
export const RUSH_JITTER = 1;
/** Frame the focus lines start to retract. */
export const RELEASE = 8;
/** How late, at most, a focus line starts its retract. */
export const RELEASE_JITTER = 1.5;
/** Frames a focus line takes to retract. */
export const RETRACT = 3.5;
export const FOCUS_END = RELEASE + RELEASE_JITTER + RETRACT;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const modeOf = (value: string | undefined) =>
  value === "focus" ? ("focus" as const) : ("trail" as const);
export const travelOf = (value: number | undefined) =>
  clamp(finite(value, DURATION), MIN_DURATION, MAX_DURATION);
export const bounceOf = (value: number | undefined) =>
  clamp(finite(value, BOUNCE), 0, 1);

export function springOf(bounce: number) {
  const landing = LANDING + CARRY * bounce;
  const kappa = (1 + Math.sqrt(1 - landing)) / 2;
  const gain = 1 / (0.5 - kappa / 3);
  const echo = ECHO * bounce;
  const decrement = -Math.log(echo);
  const damping = echo > 0 ? decrement / Math.hypot(Math.PI, decrement) : 1;
  const natural = 1 / (1 + SOFTEN * bounce);
  const decay = damping * natural;
  return {
    kappa,
    gain,
    contact: gain * (1 - kappa),
    decay,
    ring: natural * Math.sqrt(1 - damping * damping),
    settle: Math.ceil(SETTLE / decay),
  };
}

// The trail's travel ends on landing; the settle is the spring ringing out
// after it. The focus rush ends on impact; the release starts the earliest
// retract, each line's own lateness (`jitter`) and its retract are beats.
export const speedLinesTimeline = defineTimeline<
  SpeedLinesElementId,
  SpeedLinesTimingProps
>(({ mode, duration, bounce }): TimelineElement<SpeedLinesElementId>[] => {
  if (modeOf(mode) === "focus") {
    return [
      {
        id: "rush",
        lane: "Lines",
        label: "rush in",
        start: 0,
        length: IMPACT,
        beats: { jitter: RUSH_JITTER },
      },
      {
        id: "release",
        lane: "Lines",
        label: "release",
        start: RELEASE,
        length: RELEASE_JITTER + RETRACT,
        follows: "rush",
        beats: { jitter: RELEASE_JITTER, retract: RETRACT },
      },
    ];
  }
  const travel = travelOf(duration);
  return [
    {
      id: "travel",
      lane: "Subject",
      label: "travel",
      start: 0,
      length: travel,
    },
    {
      id: "settle",
      lane: "Subject",
      label: "settle",
      start: travel,
      length: springOf(bounceOf(bounce)).settle,
      follows: "travel",
    },
  ];
});
