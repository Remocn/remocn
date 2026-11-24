import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The sign, the digits and the unit rising in, the plus turning into a
// times sign, the unit dropping away, the figure swelling to full size and
// the label coming in word by word. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type TimesTurnElementId =
  | "sign"
  | "digits"
  | "unit"
  | "turn"
  | "drop"
  | "swell"
  | `word:${number}`;

export interface TimesTurnTimingProps {
  label?: string;
  stagger?: number;
}

export const DEFAULT_LABEL = "more launch cuts from the same storyboard";

const RISE_AT = 0;
const RISE_LEN = 16;
const TURN_AT = 30;
/** The turn is a spring; this is about how long it takes to settle. */
const TURN_LEN = 20;
const PCT_AT = 32;
const PCT_LEN = 14;
const SWELL_AT = 38;
const SWELL_END = 74;
const LABEL_AT = 64;
const WORD_LEN = 16;

/** The label's words, as they come in. */
export function labelWords(label: string) {
  return label ? label.split(" ") : [];
}

// `sign`, `digits` and `unit` rise in a chain. `turn` springs the plus
// round into a times sign (the spring keeps its own pace). `drop` sinks the
// unit; `swell` grows the figure, its fill coming in from `fill` to
// `fillEnd`. `word:<i>` brings in word `i` of the label, each following the
// one before.
export const timesTurnTimeline = defineTimeline<
  TimesTurnElementId,
  TimesTurnTimingProps
>(
  ({
    label = DEFAULT_LABEL,
    stagger = 2,
  }): TimelineElement<TimesTurnElementId>[] => {
    const rise = (k: number) => ({
      start: RISE_AT + k * 2,
      length: RISE_LEN,
    });
    return [
      { id: "sign", lane: "Figure", label: "sign", ...rise(0) },
      {
        id: "digits",
        lane: "Figure",
        label: "digits",
        ...rise(1),
        follows: "sign",
      },
      {
        id: "unit",
        lane: "Figure",
        label: "unit",
        ...rise(2),
        follows: "digits",
      },
      {
        id: "turn",
        lane: "Sign",
        label: "turn",
        start: TURN_AT,
        length: TURN_LEN,
        follows: "unit",
      },
      {
        id: "drop",
        lane: "Figure",
        label: "unit drops",
        start: PCT_AT,
        length: PCT_LEN,
        follows: "turn",
      },
      {
        id: "swell",
        lane: "Swell",
        label: "swell",
        start: SWELL_AT,
        length: SWELL_END - SWELL_AT,
        follows: "turn",
        beats: { fill: 4, fillEnd: SWELL_END - 4 - SWELL_AT },
      },
      ...labelWords(label).map(
        (w, k): TimelineElement<TimesTurnElementId> => ({
          id: `word:${k}`,
          lane: "Label",
          label: w,
          start: LABEL_AT + k * stagger,
          length: WORD_LEN,
          follows: k > 0 ? `word:${k - 1}` : "swell",
        }),
      ),
    ];
  },
);
