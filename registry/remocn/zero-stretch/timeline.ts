import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure's characters rising in, the zero stretching open into a
// window, the label rising inside it word by word, and the caption under
// the figure. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ZeroStretchElementId =
  | `char:${number}`
  | "stretch"
  | `word:${number}`
  | "caption";

export interface ZeroStretchTimingProps {
  value?: string;
  label?: string;
  stagger?: number;
}

export const DEFAULT_VALUE = "200";
export const DEFAULT_LABEL = "components";

const RISE_AT = 2;
const RISE_LEN = 18;
export const RISE_GAP = 3;
const STRETCH_AT = 34;
/** About how long the zero's opening spring takes to settle. */
const STRETCH_LEN = 36;
const LABEL_AT = 50;
const LABEL_GAP = 3;
const CAPTION_AT = 72;

// `char:<i>` raises character `i` of the value over its length; a chain.
// `stretch` springs the zero open from its start; the window fills from
// `fillAt` to `fillEnd`. A value without a zero gets one added, rising from
// `zeroAt` (negative) over `rise`. The label's words are a chain inside the
// window, after `stretch`; the caption follows it too.
export const zeroStretchTimeline = defineTimeline<
  ZeroStretchElementId,
  ZeroStretchTimingProps
>(({ value = DEFAULT_VALUE, label = DEFAULT_LABEL, stagger = RISE_GAP }) => {
  const elements: TimelineElement<ZeroStretchElementId>[] = [
    ...Array.from(value).map(
      (ch, i): TimelineElement<ZeroStretchElementId> => ({
        id: `char:${i}`,
        lane: "Figure",
        label: ch,
        start: RISE_AT + i * stagger,
        length: RISE_LEN,
        follows: i > 0 ? `char:${i - 1}` : undefined,
      }),
    ),
    {
      id: "stretch",
      lane: "Zero",
      label: "Stretch",
      start: STRETCH_AT,
      length: STRETCH_LEN,
      beats: { fillAt: 2, fillEnd: 16, zeroAt: -6, rise: RISE_LEN },
    },
    ...label.split(" ").map(
      (w, k): TimelineElement<ZeroStretchElementId> => ({
        id: `word:${k}`,
        lane: "Label",
        label: w,
        start: LABEL_AT + k * LABEL_GAP,
        length: 16,
        follows: k > 0 ? `word:${k - 1}` : "stretch",
      }),
    ),
    {
      id: "caption",
      lane: "Caption",
      label: "Caption",
      start: CAPTION_AT,
      length: 18,
      follows: "stretch",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
