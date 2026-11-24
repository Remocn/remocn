import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The outlined number rising in, the label rising word by word, and the
// count draining the number's fill from `from` to `value`. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SlimCountElementId = "number" | `word:${number}` | "count";

export interface SlimCountTimingProps {
  label?: string;
  countDuration?: number;
  stagger?: number;
}

export const DEFAULT_LABEL = "Keyframes left to set by hand";

const RISE_LEN = 16;
const LABEL_AT = 6;
const COUNT_AT = 24;
const COUNT_END = 84;

/** The label's words, as the component lays them out. */
export function labelWords(label: string) {
  return label ? label.split(" ") : [];
}

// `word:<i>` is the label's i-th word; each follows the one before.
export const slimCountTimeline = defineTimeline<
  SlimCountElementId,
  SlimCountTimingProps
>(
  ({
    label = DEFAULT_LABEL,
    countDuration = COUNT_END - COUNT_AT,
    stagger = 3,
  }) => {
    const elements: TimelineElement<SlimCountElementId>[] = [
      {
        id: "number",
        lane: "Number",
        label: "Rise",
        start: 0,
        length: RISE_LEN,
      },
      ...labelWords(label).map(
        (w, i): TimelineElement<SlimCountElementId> => ({
          id: `word:${i}`,
          lane: "Label",
          label: w,
          start: LABEL_AT + i * stagger,
          length: 16,
          follows: i > 0 ? `word:${i - 1}` : undefined,
        }),
      ),
      {
        id: "count",
        lane: "Count",
        label: "Count",
        start: COUNT_AT,
        length: countDuration,
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
