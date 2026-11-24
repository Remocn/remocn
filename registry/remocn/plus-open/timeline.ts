import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's digits rising in, the plus landing beside them, the label
// rising, the plus's arms reaching the frame's edges, the four quarters
// splitting open onto the next scene, and its statement rising in word by
// word. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type PlusOpenElementId =
  | `digit:${number}`
  | "plus"
  | "label"
  | "arms"
  | "open"
  | `word:${number}`;

export interface PlusOpenTimingProps {
  value?: string;
  next?: string;
  hold?: number;
  stagger?: number;
}

export const DEFAULT_VALUE = "150";
export const DEFAULT_NEXT = "Here’s everything new.";

const RISE_AT = 0;
const RISE_LEN = 18;
const RISE_GAP = 3;
const PLUS_AT = 12;
/** About how long the plus's landing spring takes to settle. */
const PLUS_LEN = 24;
const LABEL_AT = 16;
export const ARMS_AT = 56;
const ARMS_LEN = 14;
const OPEN_AT = 70;
const OPEN_LEN = 28;
const NEXT_AT = 82;

// `digit:<i>` raises digit `i`; a chain. `plus` lands with a spring and
// fades in over `on`. `arms` grows the horizontal arms over `grow` and the
// vertical ones `vertical` frames later. `open` splits the frame over its
// length; the plus stops glowing from `litFrom` to `litTo`. The statement's
// words are a chain after `open`.
export const plusOpenTimeline = defineTimeline<
  PlusOpenElementId,
  PlusOpenTimingProps
>(
  ({
    value = DEFAULT_VALUE,
    next = DEFAULT_NEXT,
    hold = ARMS_AT,
    stagger = 3,
  }) => {
    const armsAt = hold;
    const openAt = hold + OPEN_AT - ARMS_AT;
    const nextAt = hold + NEXT_AT - ARMS_AT;
    const elements: TimelineElement<PlusOpenElementId>[] = [
      ...Array.from(value).map(
        (ch, i): TimelineElement<PlusOpenElementId> => ({
          id: `digit:${i}`,
          lane: "Figure",
          label: ch,
          start: RISE_AT + i * RISE_GAP,
          length: RISE_LEN,
          follows: i > 0 ? `digit:${i - 1}` : undefined,
        }),
      ),
      {
        id: "plus",
        lane: "Plus",
        label: "Plus",
        start: PLUS_AT,
        length: PLUS_LEN,
        beats: { on: 5 },
      },
      {
        id: "label",
        lane: "Label",
        label: "Label",
        start: LABEL_AT,
        length: 18,
      },
      {
        id: "arms",
        lane: "Plus",
        label: "Arms",
        start: armsAt,
        length: 3 + ARMS_LEN,
        beats: { vertical: 3, grow: ARMS_LEN },
      },
      {
        id: "open",
        lane: "Plus",
        label: "Open",
        start: openAt,
        length: OPEN_LEN,
        follows: "arms",
        beats: { litFrom: -2, litTo: 14 },
      },
      ...next.split(" ").map(
        (w, k): TimelineElement<PlusOpenElementId> => ({
          id: `word:${k}`,
          lane: "Statement",
          label: w,
          start: nextAt + k * stagger,
          length: 18,
          follows: k > 0 ? `word:${k - 1}` : "open",
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
