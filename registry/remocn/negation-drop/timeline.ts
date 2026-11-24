import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each line rising in, and each line's contraction dropping away while the
// line closes up and the kept word lights. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type NegationDropElementId = `line:${number}` | `drop:${number}`;

export interface NegationDropTimingProps {
  lines?: string[];
  dropAt?: number;
  stagger?: number;
}

export const DEFAULT_LINES = [
  "You can’t animate.",
  "You don’t have a team.",
  "It isn’t done.",
];

const ENTER_AT = -4;
const ENTER_STAGGER = 6;
const ENTER_LEN = 16;
const FLIP_AT = 44;
const FLIP_GAP = 14;
const FALL_LEN = 9;
const CLOSE_DELAY = 6;
const LIT_DELAY = 6;
const LIT_LEN = 10;

// `line:<i>` rises in; the first starts before the scene does. `drop:<i>`
// starts when line `i`'s contraction falls (over `fall`); it tints dim from
// `tint` to `tintEnd` (before the start), the line springs closed from
// `close`, and the kept word's block lights from `lit` over `litLen`. Each
// list is a chain.
export const negationDropTimeline = defineTimeline<
  NegationDropElementId,
  NegationDropTimingProps
>(({ lines = DEFAULT_LINES, dropAt = FLIP_AT, stagger = FLIP_GAP }) => {
  const elements: TimelineElement<NegationDropElementId>[] = [
    ...lines.map(
      (line, i): TimelineElement<NegationDropElementId> => ({
        id: `line:${i}`,
        lane: "Lines",
        label: line,
        start: ENTER_AT + i * ENTER_STAGGER,
        length: ENTER_LEN,
        follows: i > 0 ? `line:${i - 1}` : undefined,
      }),
    ),
    ...lines.map(
      (line, i): TimelineElement<NegationDropElementId> => ({
        id: `drop:${i}`,
        lane: "Drops",
        label: line,
        start: dropAt + i * stagger,
        length: LIT_DELAY + LIT_LEN,
        follows: i > 0 ? `drop:${i - 1}` : undefined,
        beats: {
          tint: -8,
          tintEnd: -1,
          fall: FALL_LEN,
          close: CLOSE_DELAY,
          lit: LIT_DELAY,
          litLen: LIT_LEN,
        },
      }),
    ),
  ];
  return elements.sort((a, b) => a.start - b.start);
});
