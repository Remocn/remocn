import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Your row coming in at the bottom, each step up past the row above, then
// the payoff chip with its flash. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type LeaderboardClimbElementId = "self" | `step:${number}` | "payoff";

export interface LeaderboardEntry {
  name: string;
  tagline: string;
  score: number;
}

export interface LeaderboardClimbTimingProps {
  entries?: LeaderboardEntry[];
  toRank?: number;
}

export const DEFAULT_ENTRIES: LeaderboardEntry[] = [
  { name: "Fieldnote", tagline: "Notes that write back", score: 2140 },
  { name: "Parcel", tagline: "Ship docs as sites", score: 1866 },
  { name: "Nightjar", tagline: "A calm inbox for teams", score: 1210 },
  { name: "Orbitdesk", tagline: "Async standups", score: 1098 },
  { name: "Lumen", tagline: "Analytics without SQL", score: 964 },
  { name: "Tally Run", tagline: "Budgets for builders", score: 880 },
  { name: "Stackbird", tagline: "Previews for every branch", score: 742 },
  { name: "Coda Room", tagline: "Rooms for pair coding", score: 655 },
];

const SELF = -6;
const SELF_IN = 12;
const STEPS = [16, 28, 38, 46, 53, 59];
const PAYOFF = 68;
/** The scene's slow push-in after the payoff runs to this frame. */
const END = 120;

/** Rows on the board, the row you start from and the one you climb to. */
export function boardOf(entries: LeaderboardEntry[], toRank: number) {
  const n = Math.min(8, entries.length);
  const fromIdx = n;
  const toIdx = Math.max(0, Math.min(n, toRank - 1));
  return { n, fromIdx, toIdx, stepCount: fromIdx - toIdx };
}

// `self` fades your row in. `step:<i>` lifts it one row (a chain, each
// running until the next); the score counts up from `scoreAt` over `score`,
// and the first step starts the camera pull at `camAt`. `payoff` (after the
// last step) pops the chip and flashes the row over `flash`, fading over
// `fade`; the camera pull lands at `camEnd` and the push-in runs to
// `driftEnd`.
export const leaderboardClimbTimeline = defineTimeline<
  LeaderboardClimbElementId,
  LeaderboardClimbTimingProps
>(({ entries = DEFAULT_ENTRIES, toRank = 3 }) => {
  const { n, stepCount } = boardOf(entries, toRank);
  const steps = STEPS.slice(0, stepCount);
  const elements: TimelineElement<LeaderboardClimbElementId>[] = [
    {
      id: "self",
      lane: "Climb",
      label: "Your row",
      start: SELF,
      length: SELF_IN,
    },
  ];
  steps.forEach((at, i) => {
    elements.push({
      id: `step:${i}`,
      lane: "Climb",
      label: `Past ${entries[n - 1 - i]?.name ?? `row ${i + 1}`}`,
      start: at,
      length: (steps[i + 1] ?? PAYOFF) - at,
      follows: i > 0 ? `step:${i - 1}` : undefined,
      beats: { scoreAt: -2, score: 9, camAt: -6 },
    });
  });
  elements.push({
    id: "payoff",
    lane: "Climb",
    label: "Payoff",
    start: PAYOFF,
    length: 26,
    follows: steps.length > 0 ? `step:${steps.length - 1}` : undefined,
    beats: { flash: 4, fade: 22, camEnd: 4, driftEnd: END - PAYOFF },
  });
  return elements;
});
