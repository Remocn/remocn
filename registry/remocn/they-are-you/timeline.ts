import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each fact rising in line by line while the block recentres, then each
// fact's pronoun flipping from `from` to `to`. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type TheyAreYouElementId = `fact:${number}` | `flip:${number}`;

export interface TheyAreYouTimingProps {
  facts?: string[];
  from?: string;
  stagger?: number;
}

export const DEFAULT_FACTS = [
  "They write React for a living.",
  "They have a launch on Monday.",
  "They’ve never touched a timeline.",
];

const IN_START = 4;
/** A wrapped fact's next line rises this much later. */
const LINE_STEP = 3;
const RISE = 16;
/** The block starts recentring for a fact this far around its start. */
const SHIFT_AT = -2;
const SHIFT_END = 12;
const FLIP = 11;

/** The facts to show; an empty list falls back to one about `from`. */
export function factsOf(facts: string[], from: string) {
  return facts.length > 0 ? facts : [`${from} build things.`];
}

// `fact:<k>` rises its lines a `line` beat apart, each over `rise`, while
// the block above recentres from its `shift` to its `shiftEnd` beat; it
// lasts until the next fact. `flip:<k>` swaps its pronoun. Both lists are
// chains. `length` here is the clip length without `speed`, as the
// spacing is counted.
export const theyAreYouTimeline = defineTimeline<
  TheyAreYouElementId,
  TheyAreYouTimingProps
>(({ facts = DEFAULT_FACTS, from = "They", stagger = 6 }, { length }) => {
  const list = factsOf(facts, from);
  const D = Math.max(100, length);
  const inStart = IN_START;
  const gapIn = Math.min(22, Math.max(12, (D * 0.3) / list.length));
  const lastIn = inStart + (list.length - 1) * gapIn;
  const flipStart = Math.max(lastIn + 26, D * 0.44);
  const flipStagger = stagger;
  const elements: TimelineElement<TheyAreYouElementId>[] = [
    ...list.map(
      (fact, k): TimelineElement<TheyAreYouElementId> => ({
        id: `fact:${k}`,
        lane: "Facts",
        label: fact,
        start: inStart + k * gapIn,
        length: k < list.length - 1 ? gapIn : RISE,
        follows: k > 0 ? `fact:${k - 1}` : undefined,
        beats: {
          line: LINE_STEP,
          rise: RISE,
          shift: SHIFT_AT,
          shiftEnd: SHIFT_END,
        },
      }),
    ),
    ...list.map(
      (fact, k): TimelineElement<TheyAreYouElementId> => ({
        id: `flip:${k}`,
        lane: "Flips",
        label: fact,
        start: flipStart + k * flipStagger,
        length: FLIP,
        follows: k > 0 ? `flip:${k - 1}` : undefined,
      }),
    ),
  ];
  return elements.sort((a, b) => a.start - b.start);
});
