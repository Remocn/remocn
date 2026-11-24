import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The rows sliding in with their rules, the first wave of style changes
// (sketch to mono) and the second (mono to the final cut). Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type IdeaSetElementId = "enter" | "draft" | "final";

export interface IdeaSetTimingProps {
  hold?: number;
  wave?: number;
}

export const HOLD = 18;
export const WAVE = 26;

const ENTER = 18;
const ROW_GAP = 4;
const RULE_GAP = 3;
const RULE = ENTER + 4;
const TURN = 10;

// The entry's `row` beat is how long one row slides in, `rowGap` the frames
// between rows; a rule draws for `rule` frames, `ruleGap` apart. A wave's
// glyphs each turn over `turn` frames, spread across the rest of the wave by
// how many glyphs there are. The waves follow the entry and each other.
export const ideaSetTimeline = defineTimeline<
  IdeaSetElementId,
  IdeaSetTimingProps
>(({ hold = HOLD, wave = WAVE }) => {
  const W1 = ENTER + hold;
  const W2 = W1 + wave + hold;
  const elements: TimelineElement<IdeaSetElementId>[] = [
    {
      id: "enter",
      lane: "Rows",
      label: "rows in",
      start: 0,
      length: ENTER,
      beats: { row: ENTER, rowGap: ROW_GAP, rule: RULE, ruleGap: RULE_GAP },
    },
    {
      id: "draft",
      lane: "Style",
      label: "sketch to mono",
      start: W1,
      length: wave,
      follows: "enter",
      beats: { turn: TURN },
    },
    {
      id: "final",
      lane: "Style",
      label: "mono to final",
      start: W2,
      length: wave,
      follows: "draft",
      beats: { turn: TURN },
    },
  ];
  return elements;
});
