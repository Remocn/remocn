import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first digit and the suffix rising in, each further digit pushing its
// slot open (the figure shrinking to fit behind it), the block settling up
// to make room for the label, and the label rising in word by word. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type MagnitudePushElementId =
  | "rise"
  | `digit:${number}`
  | "settle"
  | `word:${number}`;

export interface MagnitudePushTimingProps {
  value?: string;
  label?: string;
  pushGap?: number;
  stagger?: number;
}

export const DEFAULT_VALUE = "1000";
export const DEFAULT_LABEL = "fewer keyframes to set by hand";

const RISE_AT = 2;
const RISE_LEN = 16;
const PUSH_AT = 30;
export const PUSH_GAP = 15;
const CAM_LAG = 5;
const CAM_LEN = 16;
export const LABEL_GAP = 4;

// `rise` lifts the first digit, and the suffix `suffix` frames later, each
// over `rise`. `digit:<i>` opens the slot of digit `i` (from 1) with a
// spring from its start; the digit rises `digit` frames in, over `rise`,
// and the figure shrinks to fit from `cam` over `camLen`. The digits are a
// chain. `settle` moves the block up for the label; the label words are a
// chain from its end, both following the last digit.
export const magnitudePushTimeline = defineTimeline<
  MagnitudePushElementId,
  MagnitudePushTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    label = DEFAULT_LABEL,
    pushGap = PUSH_GAP,
    stagger = LABEL_GAP,
  }) => {
    const chars = Array.from(value);
    const pushes = chars.length - 1;
    const endAt = PUSH_AT + Math.max(0, pushes - 1) * pushGap;
    const labelAt = endAt + (pushes > 0 ? 18 : 6);
    const last: MagnitudePushElementId =
      pushes > 0 ? `digit:${pushes}` : "rise";
    const elements: TimelineElement<MagnitudePushElementId>[] = [
      {
        id: "rise",
        lane: "Figure",
        label: chars[0] ?? "",
        start: RISE_AT,
        length: 3 + RISE_LEN,
        beats: { suffix: 3, rise: RISE_LEN },
      },
      ...chars.slice(1).map(
        (ch, k): TimelineElement<MagnitudePushElementId> => ({
          id: `digit:${k + 1}`,
          lane: "Figure",
          label: ch,
          start: PUSH_AT + k * pushGap,
          length: CAM_LAG + CAM_LEN,
          follows: k > 0 ? `digit:${k}` : "rise",
          beats: { digit: 3, rise: RISE_LEN, cam: CAM_LAG, camLen: CAM_LEN },
        }),
      ),
      {
        id: "settle",
        lane: "Layout",
        label: "Settle",
        start: labelAt - 6,
        length: 24,
        follows: last,
      },
      ...label.split(" ").map(
        (w, k): TimelineElement<MagnitudePushElementId> => ({
          id: `word:${k}`,
          lane: "Label",
          label: w,
          start: labelAt + k * stagger,
          length: 16,
          follows: k > 0 ? `word:${k - 1}` : last,
        }),
      ),
    ];
    return elements;
  },
);
