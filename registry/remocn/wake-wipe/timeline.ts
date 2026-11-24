import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// One wake sweeping across the frame per line, each erasing the line before
// and revealing its own, the eyebrow rising in under the first, and the
// highlight settling into its gradient after the last reveal. When the reveal
// starts inside a wake comes from where the wake front crosses the old line,
// so it is not an element: the wake carries its length as the `reveal` beat.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type WakeWipeElementId = "eyebrow" | `wake:${number}`;

export interface WakeWipeTimingProps {
  lines?: string[];
  hold?: number;
  /** Frames for one wake to sweep across the frame. */
  wake?: number;
}

export const DEFAULT_LINES = [
  "Animations you own.",
  "Transitions that land.",
  "Ship the launch video today.",
];
const START = 4;
const HOLD = 54;
const WAKE_LEN = 28;
const REVEAL_LEN = 18;

// Wake `k` sweeps over its length and holds until the next one; each follows
// the one before. The last wake also carries the highlight's settle, from
// `settleFrom` to `settleTo` around the end of its reveal.
export const wakeWipeTimeline = defineTimeline<
  WakeWipeElementId,
  WakeWipeTimingProps
>(({ lines = DEFAULT_LINES, hold = HOLD, wake = WAKE_LEN }) => {
  const items = lines.length ? lines : [""];
  const last = items.length - 1;
  const startOf = (k: number) => START + k * hold;
  const elements = items.map(
    (line, k): TimelineElement<WakeWipeElementId> => ({
      id: `wake:${k}`,
      lane: "Wakes",
      label: line,
      start: startOf(k),
      length: wake,
      follows: k > 0 ? `wake:${k - 1}` : undefined,
      beats:
        k === last
          ? { reveal: REVEAL_LEN, settleFrom: -4, settleTo: 8 }
          : { reveal: REVEAL_LEN },
    }),
  );
  elements.splice(1, 0, {
    id: "eyebrow",
    lane: "Eyebrow",
    label: "eyebrow",
    start: START + 8,
    length: 18,
  });
  return elements.sort((a, b) => a.start - b.start);
});
