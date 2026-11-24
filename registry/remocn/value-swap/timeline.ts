import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each value hands over to the next. Frames on the 30 fps scene
// timeline. The ids are public: a saved `timing` prop refers to them.

export type ValueSwapElementId = `swap:${number}`;

export interface ValueSwapTimingProps {
  values?: string[];
  at?: number | number[];
  duration?: number;
}

const DURATION = 10;
/** The docs example's values, for a schedule read without the props. */
const EXAMPLE_VALUES = ["Draft", "In review", "Shipped"];
const EXAMPLE_AT = [30, 60];

// `swap:<i>` is the change from value `i` to value `i + 1`, starting at the
// `i`-th entry of `at`. Each swap follows the one before it in time.
export const valueSwapTimeline = defineTimeline<
  ValueSwapElementId,
  ValueSwapTimingProps
>(({ values = EXAMPLE_VALUES, at = EXAMPLE_AT, duration = DURATION }) => {
  const ats = Array.isArray(at) ? at : [at];
  const count = Math.min(values.length, ats.length + 1);
  const swaps: TimelineElement<ValueSwapElementId>[] = [];
  for (let i = 0; i < count - 1; i++) {
    swaps.push({
      id: `swap:${i}`,
      lane: "Value",
      label: `${values[i]} → ${values[i + 1]}`,
      start: ats[i],
      length: duration,
    });
  }
  swaps.sort((a, b) => a.start - b.start);
  return swaps.map((swap, k) =>
    k > 0 ? { ...swap, follows: swaps[k - 1].id } : swap,
  );
});
