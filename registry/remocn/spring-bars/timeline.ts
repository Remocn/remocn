import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The axis drawing out and the coils fading up, each weight dropping onto
// its spring and bouncing, then the springs morphing into bars with the
// stat and caption rising over the accent bar. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type SpringBarsElementId =
  | "axis"
  | "coils"
  | `spring:${number}`
  | "morph";

export interface SpringBarsTimingProps {
  values?: number[];
  stagger?: number;
}

export const DEFAULT_VALUES = [0.58, 0.72, 0.52, 0.66, 0.97, 0.62, 0.7];

const SPAWN0 = 14;
export const STAGGER = 3;
const FALL = 15;
const COIL_STEP = 1.5;
const COIL_IN = 12;

/** The values the chart draws: the first ten, clamped to 0.3–1. */
export function valuesOf(values: number[]) {
  return values.slice(0, 10).map((v) => Math.max(0.3, Math.min(1, v)));
}

// `coils` fades coil i up from `step` × i frames after its start, each over
// `appear`. `spring:<i>` drops weight i over its length; the spring bounces
// from its end. Each spring follows the one before. `morph` turns the
// springs into bars over its length; the stat rises from `label` to
// `labelEnd` and the caption from `caption` to `captionEnd`.
export const springBarsTimeline = defineTimeline<
  SpringBarsElementId,
  SpringBarsTimingProps
>(({ values = DEFAULT_VALUES, stagger = STAGGER }) => {
  const vals = valuesOf(values);
  const springs = vals.map((_, i) => {
    const spawn = SPAWN0 + i * stagger;
    return { i, spawn, contact: spawn + FALL };
  });
  const lastContact = Math.max(...springs.map((s) => s.contact));
  const morphAt = lastContact + 44;
  const elements: TimelineElement<SpringBarsElementId>[] = [
    { id: "axis", lane: "Chart", label: "Axis", start: 0, length: 14 },
    {
      id: "coils",
      lane: "Coils",
      label: "Coils",
      start: 2,
      length: COIL_IN + Math.max(0, vals.length - 1) * COIL_STEP,
      beats: { step: COIL_STEP, appear: COIL_IN },
    },
    ...springs.map(
      (s): TimelineElement<SpringBarsElementId> => ({
        id: `spring:${s.i}`,
        lane: "Weights",
        label: `Weight ${s.i + 1}`,
        start: s.spawn,
        length: FALL,
        follows: s.i > 0 ? `spring:${s.i - 1}` : undefined,
      }),
    ),
    {
      id: "morph",
      lane: "Chart",
      label: "Morph",
      start: morphAt,
      length: 20,
      follows: springs.length > 0 ? `spring:${springs.length - 1}` : undefined,
      beats: { label: 10, labelEnd: 30, caption: 18, captionEnd: 36 },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
