import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each hard cut to the next number, the gaps shrinking toward the last,
// which lands with the label. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type SmashCountElementId = `cut:${number}`;

export interface SmashCountTimingProps {
  value?: number;
  from?: number;
  cuts?: number;
  prefix?: string;
  suffix?: string;
  firstGap?: number;
  lastGap?: number;
}

export const FIRST_GAP = 13;
export const LAST_GAP = 6;
const PUNCH_LEN = 5;
const LAND_LEN = 12;

/** The numbers the count cuts through, eased toward `value`. */
export function cutValues(from: number, value: number, cuts: number) {
  const n = Math.max(2, Math.min(cuts, Math.abs(value - from) + 1));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const x = k / (n - 1);
    const e = 1 - (1 - x) ** 1.7;
    out.push(Math.round(from + (value - from) * e));
  }
  for (let k = 1; k < n; k++) {
    if (out[k] === out[k - 1]) out[k] = out[k - 1] + Math.sign(value - from);
  }
  out[n - 1] = value;
  return out;
}

function cutTimes(n: number, firstGap: number, lastGap: number) {
  const out = [0];
  for (let k = 1; k < n; k++) {
    const g = firstGap + (lastGap - firstGap) * ((k - 1) / Math.max(1, n - 2));
    out.push(out[k - 1] + g);
  }
  return out.map((v) => Math.round(v));
}

// `cut:<k>` shows number `k` from its start until the next cut; its scale
// punch settles over `punch`. The last cut is the landing: its length is
// the landing settle. The cuts form a chain; the one on screen is the last
// that has started.
export const smashCountTimeline = defineTimeline<
  SmashCountElementId,
  SmashCountTimingProps
>(
  ({
    value = 64,
    from = 1,
    cuts = 6,
    prefix = "",
    suffix = "",
    firstGap = FIRST_GAP,
    lastGap = LAST_GAP,
  }): TimelineElement<SmashCountElementId>[] => {
    const values = cutValues(
      Math.round(from),
      Math.round(value),
      Math.round(cuts),
    );
    const n = values.length;
    const times = cutTimes(n, firstGap, lastGap);
    return values.map((v, k) => ({
      id: `cut:${k}`,
      lane: "Cuts",
      label: `${prefix}${v.toLocaleString("en-US")}${suffix}`,
      start: times[k],
      length: k < n - 1 ? times[k + 1] - times[k] : LAND_LEN,
      follows: k > 0 ? `cut:${k - 1}` : undefined,
      beats: { punch: k < n - 1 ? PUNCH_LEN : LAND_LEN },
    }));
  },
);
