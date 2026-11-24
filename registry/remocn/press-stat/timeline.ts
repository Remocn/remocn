import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The caption words rising in one after another, the number rising in after
// them, and the press: the number inflating to the headline while it counts
// up. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type PressStatElementId = `word:${number}` | "number" | "press";

export interface PressStatTimingProps {
  before?: string;
  pressAt?: number;
  countLength?: number;
}

export const DEFAULT_BEFORE = "Edit time down";
const RISE_LEN = 14;
const RISE_GAP = 4;
export const PRESS_AT = 30;
export const COUNT_LEN = 42;

// `word:<i>` is caption word `i`; the words and the number after them form a
// chain. `press` starts the count and the inflate spring; it runs as long as
// the count.
export const pressStatTimeline = defineTimeline<
  PressStatElementId,
  PressStatTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    pressAt = PRESS_AT,
    countLength = COUNT_LEN,
  }) => {
    const words = before.split(" ").filter(Boolean);
    const elements: TimelineElement<PressStatElementId>[] = words.map(
      (w, i) => ({
        id: `word:${i}`,
        lane: "Caption",
        label: w,
        start: i * RISE_GAP,
        length: RISE_LEN,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    elements.push(
      {
        id: "number",
        lane: "Caption",
        label: "number",
        start: words.length * RISE_GAP,
        length: RISE_LEN,
        follows: words.length > 0 ? `word:${words.length - 1}` : undefined,
      },
      {
        id: "press",
        lane: "Press",
        label: "press",
        start: pressAt,
        length: countLength,
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
