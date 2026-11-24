import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each description building word by word and folding up into a small
// kicker, then the lead line, the rule drawing across and the name rising
// in. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// schedule is paced to the clip (`pace`, 0.5 to 1.5 times its natural
// length), so the motion fills it and leaves a tail. The ids are public: a
// saved `timing` prop refers to them.

export type WeCallItElementId = `desc:${number}` | "lead" | "rule" | "name";

export interface WeCallItTimingProps {
  descriptions?: string[];
  name?: string;
  stagger?: number;
  beat?: number;
}

export const DEFAULT_DESCRIPTIONS = [
  "Scenes you install like components.",
  "Edits that land as commits.",
  "A film that ships with the release.",
];
export const DEFAULT_NAME = "video registry.";
export const STEP = 40;

const FIRST = 6;
const WORD = 16;
const HOLD = 26;
const MOVE = 18;
const LEAD = 14;
const RULE = 22;
const NAME_ROW = 5;
const NAME_RISE = 24;

export function splitWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

// In `desc:<i>` word `k` rises from `k * stagger` over `word`; the
// description holds until `hold` and folds into the kicker over `move`. The
// name's rows rise `row` apart, each over `rise`. The descriptions form a
// chain; the lead follows the last one, and the rule and the name follow
// the lead. `length` is the clip length without `speed`, as the pace is
// counted.
export const weCallItTimeline = defineTimeline<
  WeCallItElementId,
  WeCallItTimingProps
>(
  (
    {
      descriptions = DEFAULT_DESCRIPTIONS,
      name = DEFAULT_NAME,
      stagger = 3,
      beat = STEP,
    },
    { length },
  ) => {
    const descs = descriptions.map(splitWords).filter((d) => d.length > 0);
    const n = descs.length;
    const nameWords = splitWords(name);
    const leadAt = FIRST + n * beat - 2;
    const ruleAt = leadAt + 4;
    const nameAt = leadAt + 10;
    const motionEnd = nameAt + nameWords.length * 4 + 24;
    const tail = Math.max(30, length * 0.18);
    const pace = Math.min(1.5, Math.max(0.5, (length - tail) / motionEnd));
    const elements: TimelineElement<WeCallItElementId>[] = [
      ...descs.map(
        (d, i): TimelineElement<WeCallItElementId> => ({
          id: `desc:${i}`,
          lane: "Descriptions",
          label: d.join(" "),
          start: (FIRST + i * beat) * pace,
          length: (HOLD + MOVE) * pace,
          follows: i > 0 ? `desc:${i - 1}` : undefined,
          beats: {
            stagger: stagger * pace,
            word: WORD * pace,
            hold: HOLD * pace,
            move: MOVE * pace,
          },
        }),
      ),
      {
        id: "lead",
        lane: "Name",
        label: "Lead",
        start: leadAt * pace,
        length: LEAD * pace,
        follows: n > 0 ? `desc:${n - 1}` : undefined,
      },
      {
        id: "rule",
        lane: "Rule",
        label: "Rule",
        start: ruleAt * pace,
        length: RULE * pace,
        follows: "lead",
      },
      {
        id: "name",
        lane: "Name",
        label: name.trim(),
        start: nameAt * pace,
        length: NAME_RISE * pace,
        follows: "lead",
        beats: { row: NAME_ROW * pace, rise: NAME_RISE * pace },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
