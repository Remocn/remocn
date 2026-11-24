import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The bands sliding in from alternating sides, the gaps closing when the word
// settles solid, and the bands passing on through after the hold. Frames on
// the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type StripeTypeElementId = `band:${number}` | "close" | `exit:${number}`;

export interface StripeTypeTimingProps {
  stripes?: number;
  settle?: "striped" | "solid";
  exit?: boolean;
  hold?: number;
}

export const DEFAULT_STRIPES = 8;
export const DEFAULT_HOLD = 30;

/** Beats on the 30 fps clock. */
export const STRIPE_TIMING = {
  stagger: 2,
  travel: 16,
  close: 10,
  /** Frames of empty screen after the exit in the preview. */
  tail: 10,
} as const;

export function finite(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** The number of bands: a whole number, at least one. */
export function stripeCount(stripes: number | undefined) {
  return Math.max(1, Math.round(finite(stripes, DEFAULT_STRIPES)));
}

/** When the bands have locked, the gaps have closed and the exit runs. */
export function stripePhases(options: StripeTypeTimingProps = {}) {
  const n = stripeCount(options.stripes);
  const { stagger, travel, close, tail } = STRIPE_TIMING;
  const entered = stagger * (n - 1) + travel;
  const settled = options.settle === "solid" ? entered + close : entered;
  const hold = Math.max(0, finite(options.hold, DEFAULT_HOLD));
  const exitStart = settled + hold;
  const exitEnd = exitStart + stagger * (n - 1) + travel;
  const exit = options.exit !== false;
  return {
    entered,
    settled,
    exitStart,
    exitEnd,
    duration: exit ? exitEnd + tail : settled + hold,
  };
}

// Each band slides in over its own element, `stagger` after the one before
// it. `close` follows the last band when the word settles solid. On the exit
// each band leaves over `exit:<k>`, the first one after the hold.
export const stripeTypeTimeline = defineTimeline<
  StripeTypeElementId,
  StripeTypeTimingProps
>((options) => {
  const n = stripeCount(options.stripes);
  const { stagger, travel, close } = STRIPE_TIMING;
  const { entered, exitStart } = stripePhases(options);
  const elements: TimelineElement<StripeTypeElementId>[] = [];
  for (let k = 0; k < n; k++) {
    elements.push({
      id: `band:${k}`,
      lane: "Bands in",
      label: `band ${k + 1}`,
      start: stagger * k,
      length: travel,
      follows: k > 0 ? `band:${k - 1}` : undefined,
    });
  }
  let last: StripeTypeElementId = `band:${n - 1}`;
  if (options.settle === "solid") {
    elements.push({
      id: "close",
      lane: "Gaps",
      label: "close",
      start: entered,
      length: close,
      follows: last,
    });
    last = "close";
  }
  if (options.exit !== false) {
    for (let k = 0; k < n; k++) {
      elements.push({
        id: `exit:${k}`,
        lane: "Bands out",
        label: `band ${k + 1}`,
        start: exitStart + stagger * k,
        length: travel,
        follows: k > 0 ? `exit:${k - 1}` : last,
      });
    }
  }
  return elements;
});
