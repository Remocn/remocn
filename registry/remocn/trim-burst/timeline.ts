import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each ray of the burst firing, in launch order. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TrimBurstElementId = `ray:${number}`;

export interface TrimBurstTimingProps {
  count?: number;
  jitter?: number;
}

/** Frames a ray takes from leaving the centre to vanishing at its reach. */
export const TRIM_LIFE = 15;
/** Frames the tail waits before chasing the head. */
export const TRIM_LAG = 3;
/** Launch spread across all rays at full jitter. */
const STAGGER = 6;
const MAX_COUNT = 32;
const COUNT = 8;
const JITTER = 0.5;

export const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export const within = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => clamp(finite(value, fallback), min, max);
export const countOf = (count: number | undefined) =>
  Math.round(within(count, COUNT, 1, MAX_COUNT));
export const jitterOf = (jitter: number | undefined) =>
  within(jitter, JITTER, 0, 1);

/** Life, lag, launch spread and total length of the burst. */
export function trimBurstPlan(
  options: { count?: number; jitter?: number } = {},
) {
  const count = countOf(options.count);
  const stagger = count > 1 ? STAGGER * jitterOf(options.jitter) : 0;
  return {
    life: TRIM_LIFE,
    lag: TRIM_LAG,
    stagger,
    length: TRIM_LIFE + stagger,
  };
}

// `ray:<k>` is the `k`-th ray to fire; which stroke that is comes from the
// seed. The rays are a chain, spread evenly over the launch spread.
export const trimBurstTimeline = defineTimeline<
  TrimBurstElementId,
  TrimBurstTimingProps
>(({ count, jitter }) => {
  const n = countOf(count);
  const { stagger } = trimBurstPlan({ count: n, jitter });
  const elements: TimelineElement<TrimBurstElementId>[] = [];
  for (let k = 0; k < n; k++) {
    elements.push({
      id: `ray:${k}`,
      lane: "Rays",
      label: `Ray ${k + 1}`,
      start: n > 1 ? (stagger * k) / (n - 1) : 0,
      length: TRIM_LIFE,
      follows: k > 0 ? `ray:${k - 1}` : undefined,
    });
  }
  return elements;
});
