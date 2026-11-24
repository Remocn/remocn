import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each word of the sentence rising in, the roadmap tag over each planned
// word, and the fills that colour the planned words in up to `progress`.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. When the
// natural schedule runs past the clip, it is compressed to fit (`pace`).
// The ids are public: a saved `timing` prop refers to them.

export type HalfBuiltElementId =
  | `word:${number}`
  | `tag:${number}`
  | `fill:${number}`;

/** One part of the sentence; `when` marks it planned (`HalfBuiltPart`). */
export interface PlanPart {
  text: string;
  when?: string;
}

export interface HalfBuiltTimingProps {
  parts?: PlanPart[];
  progress?: number;
  stagger?: number;
}

export const DEFAULT_PARTS: PlanPart[] = [
  { text: "It cuts," },
  { text: "captions,", when: "Spring" },
  { text: "narrates", when: "Summer" },
  { text: "and" },
  { text: "translates", when: "Later" },
  { text: "your launch film." },
];

export const WORD_GAP = 3;
const RISE = 12;
const TAG_GAP = 5;
const TAG_RISE = 14;
const FILL_FULL = 30;
const FILL_PAUSE = 12;
const SETTLE = 10;
/** A fully filled word settles into the ink this long after its fill. */
const SETTLE_DELAY = 2;

export interface Unit {
  key: string;
  text: string;
  plan: number;
  when?: string;
}

/** The sentence as units: single words, and each planned part whole. */
export function toUnits(parts: PlanPart[]) {
  const units: Unit[] = [];
  let plan = 0;
  parts.forEach((p, pi) => {
    if (p.when !== undefined) {
      units.push({ key: `p${pi}`, text: p.text.trim(), plan, when: p.when });
      plan += 1;
    } else {
      p.text
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w, wi) => {
          units.push({ key: `p${pi}-${wi}`, text: w, plan: -1 });
        });
    }
  });
  return { units, planned: plan };
}

/** How many planned words `progress` fills, clamped to the plan. */
export function goalOf(planned: number, progress: number) {
  return Math.max(0, Math.min(planned, progress));
}

// `word:<i>` is unit `i` (a planned part counts as one unit); `tag:<j>` and
// `fill:<j>` belong to planned unit `j`. Each list is a chain. A fill's
// `settleDelay` and `settle` beats time the hand-over to the ink after it.
// `length` here is the clip length without `speed`, as the pace is counted.
export const halfBuiltTimeline = defineTimeline<
  HalfBuiltElementId,
  HalfBuiltTimingProps
>(
  (
    { parts = DEFAULT_PARTS, progress = 1.6, stagger = WORD_GAP },
    { length },
  ) => {
    const { units, planned } = toUnits(parts);
    const goal = goalOf(planned, progress);
    const wordsIn = 2 + units.length * stagger + 12;
    const tagsAt = Math.max(16, wordsIn - 8);
    const fillAt = tagsAt + planned * TAG_GAP + 14;
    const segments: { start: number; end: number; amount: number }[] = [];
    let cursor = fillAt;
    for (let j = 0; j < Math.ceil(goal); j++) {
      const amount = Math.min(1, goal - j);
      const dur = Math.max(16, FILL_FULL * amount);
      segments.push({ start: cursor, end: cursor + dur, amount });
      cursor += dur + FILL_PAUSE + (amount >= 1 ? SETTLE : 0);
    }
    const naturalEnd = segments.length
      ? segments[segments.length - 1].end + SETTLE
      : fillAt;
    const pace = Math.max(1, (naturalEnd + 30) / Math.max(1, length));

    const planUnits = units.filter((u) => u.plan >= 0);
    const elements: TimelineElement<HalfBuiltElementId>[] = [
      ...units.map(
        (u, i): TimelineElement<HalfBuiltElementId> => ({
          id: `word:${i}`,
          lane: "Words",
          label: u.text,
          start: (2 + i * stagger) / pace,
          length: RISE / pace,
          follows: i > 0 ? `word:${i - 1}` : undefined,
        }),
      ),
      ...planUnits.map(
        (u, j): TimelineElement<HalfBuiltElementId> => ({
          id: `tag:${j}`,
          lane: "Tags",
          label: u.when ?? "",
          start: (tagsAt + j * TAG_GAP) / pace,
          length: TAG_RISE / pace,
          follows: j > 0 ? `tag:${j - 1}` : undefined,
        }),
      ),
      ...segments.map(
        (seg, j): TimelineElement<HalfBuiltElementId> => ({
          id: `fill:${j}`,
          lane: "Fills",
          label: planUnits[j]?.text ?? "",
          start: seg.start / pace,
          length: (seg.end - seg.start) / pace,
          follows: j > 0 ? `fill:${j - 1}` : undefined,
          beats: { settleDelay: SETTLE_DELAY / pace, settle: SETTLE / pace },
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
