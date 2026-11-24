import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure rising into its band, the stripes painting it in while the
// number counts, and the label rising word by word as the paint ends.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type StripeCountElementId = "rise" | "paint" | `word:${number}`;

export interface StripeCountTimingProps {
  label?: string;
  paintDuration?: number;
  stagger?: number;
}

export const DEFAULT_LABEL = "scenes that take your brand colour from one prop";

const RISE_AT = 0;
const RISE_LEN = 16;
const PAINT_AT = 16;
const PAINT_END = 76;
const LABEL_AT = 66;

/** The label's words, as the component lays them out. */
export function labelWordsOf(label: string) {
  return label ? label.split(" ") : [];
}

// `word:<k>` is the label's k-th word. The first follows `paint`, starting
// a little before its end (unless a very short paint puts it before the
// paint's start); each next one follows the one before.
export const stripeCountTimeline = defineTimeline<
  StripeCountElementId,
  StripeCountTimingProps
>(
  ({
    label = DEFAULT_LABEL,
    paintDuration = PAINT_END - PAINT_AT,
    stagger = 2,
  }) => {
    const labelAt = PAINT_AT + paintDuration - (PAINT_END - LABEL_AT);
    const elements: TimelineElement<StripeCountElementId>[] = [
      {
        id: "rise",
        lane: "Figure",
        label: "Rise",
        start: RISE_AT,
        length: RISE_LEN,
      },
      {
        id: "paint",
        lane: "Figure",
        label: "Paint",
        start: PAINT_AT,
        length: paintDuration,
      },
      ...labelWordsOf(label).map(
        (w, k): TimelineElement<StripeCountElementId> => ({
          id: `word:${k}`,
          lane: "Label",
          label: w,
          start: labelAt + k * stagger,
          length: 16,
          follows:
            k > 0 ? `word:${k - 1}` : labelAt >= PAINT_AT ? "paint" : undefined,
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
