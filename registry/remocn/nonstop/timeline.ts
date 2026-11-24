import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The label and counter rising in, each count rolling down to zero, the zero
// shrinking into the "o" of "No", the "N" rising beside it, and the line
// closing up into "Nonstop.". Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type NonstopElementId =
  | "enter"
  | `count:${number}`
  | "shrink"
  | "board"
  | "close";

export interface NonstopTimingProps {
  from?: number;
  interval?: number;
  hold?: number;
}

export const STEP = 20;
export const ZERO_HOLD = 26;
const FROM = 3;

const IN = 4;
const IN_LEN = 18;
const FIRST_STEP = 34;
const ROLL = 10;
const SHRINK = 14;
const SHRINK_TAIL = 4;
const BOARD_GAP = 6;
const CLOSE_GAP = 26;
const CLOSE = 13;

/** The number the count starts from: a whole number from 1 to 9. */
export function countFrom(from: number) {
  return Math.max(1, Math.min(9, Math.round(from)));
}

// `enter` raises the label and the counter. `count:<i>` rolls the count from
// `from - i` to `from - i - 1`, a chain; `shrink` follows the last count,
// holding the zero first, and turns it into the "o"; `board` follows the
// shrink and raises the "N"; `close` follows the board and closes the line
// into one word.
export const nonstopTimeline = defineTimeline<
  NonstopElementId,
  NonstopTimingProps
>(({ from = FROM, interval = STEP, hold = ZERO_HOLD }) => {
  const countSteps = countFrom(from);
  const stepAt = (k: number) => FIRST_STEP + (k - 1) * interval;
  const zeroAt = stepAt(countSteps);
  const shrinkAt = zeroAt + ROLL + hold;
  const boardAt = shrinkAt + BOARD_GAP;
  const closeAt = boardAt + SHRINK + CLOSE_GAP;
  const elements: TimelineElement<NonstopElementId>[] = [
    { id: "enter", lane: "Line", label: "enter", start: IN, length: IN_LEN },
    ...Array.from(
      { length: countSteps },
      (_, i): TimelineElement<NonstopElementId> => ({
        id: `count:${i}`,
        lane: "Count",
        label: `${countSteps - i} → ${countSteps - i - 1}`,
        start: stepAt(i + 1),
        length: ROLL,
        follows: i > 0 ? `count:${i - 1}` : undefined,
      }),
    ),
    {
      id: "shrink",
      lane: "Count",
      label: "0 → o",
      start: shrinkAt,
      length: SHRINK + SHRINK_TAIL,
      follows: `count:${countSteps - 1}`,
    },
    {
      id: "board",
      lane: "N",
      label: "N",
      start: boardAt,
      length: SHRINK,
      follows: "shrink",
    },
    {
      id: "close",
      lane: "Count",
      label: "Nonstop.",
      start: closeAt,
      length: CLOSE,
      follows: "board",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
