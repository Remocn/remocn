import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The tagline card shrinking to make room for the stat rail: the logo and
// each tagline word rising in, the slow push on the photo, the card
// shrinking aside, the rail's cards springing in, each step that scrolls
// the rail to the next stat, and the payoff chip on the last one. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type StatRailElementId =
  | "logo"
  | `word:${number}`
  | "drift"
  | "shrink"
  | "rail"
  | `step:${number}`
  | "pay";

/** A stat as the schedule reads it (`Stat`). */
export interface RailStat {
  value: string;
  label: string;
}

export interface StatRailTimingProps {
  stats?: RailStat[];
  tagline?: string;
  hold?: number;
  stagger?: number;
}

export const DEFAULT_STATS: RailStat[] = [
  { value: "120", label: "components ready to install" },
  { value: "38", label: "motion design primitives" },
  { value: "12", label: "launch templates, ready as-is" },
  { value: "4", label: "minutes from install to first render" },
];
export const DEFAULT_TAGLINE = "The *future* of launch video is code";

const BEATS = [
  { name: "tagline", at: 0 },
  { name: "shrink", at: 30 },
  { name: "railIn", at: 36 },
  { name: "step0", at: 42 },
  { name: "step1", at: 66 },
  { name: "step2", at: 84 },
  { name: "step3", at: 96 },
  { name: "end", at: 144 },
] as const;

type BeatName = (typeof BEATS)[number]["name"];
const beatAt = (n: BeatName) => BEATS.find((b) => b.name === n)?.at ?? 0;
const STEPS: BeatName[] = ["step0", "step1", "step2", "step3"];
const WORD_AT = -3;
const WORD_RISE = 13;
/** About as long as the card spring takes to settle after the last step. */
const LAST_STEP = 18;

// `logo` springs up from its start and fades in from `fadeAt` to its end.
// `word:<i>` rises over its length; the words form a chain. `drift` pushes
// the photo in over the whole scene. `shrink` springs the card aside; `rail`
// follows it, springing each card in `stagger` after the one before. Each
// `step:<k>` springs the rail on to stat `k`, lasting until the next step;
// the steps form a chain. `pay` follows the last step: its colour turns over
// its length and its chip springs from `chip`.
export const statRailTimeline = defineTimeline<
  StatRailElementId,
  StatRailTimingProps
>(
  ({
    stats = DEFAULT_STATS,
    tagline = DEFAULT_TAGLINE,
    hold = 30,
    stagger = 2,
  }) => {
    const beat = (n: BeatName) =>
      beatAt(n) + (n === "tagline" ? 0 : hold - beatAt("shrink"));
    const last = Math.max(0, stats.length - 1);
    const elements: TimelineElement<StatRailElementId>[] = [
      {
        id: "logo",
        lane: "Tagline",
        label: "logo",
        start: -4,
        length: 12,
        beats: { fadeAt: 4 },
      },
      {
        id: "drift",
        lane: "Photo",
        label: "push in",
        start: 0,
        length: beat("end"),
      },
    ];
    tagline.split(" ").forEach((raw, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Tagline",
        label: raw.replace(/^\*(.*)\*$/, "$1"),
        start: WORD_AT + i * stagger,
        length: WORD_RISE,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      });
    });
    elements.push(
      {
        id: "shrink",
        lane: "Card",
        label: "shrink",
        start: beat("shrink"),
        length: beat("railIn") - beat("shrink"),
      },
      {
        id: "rail",
        lane: "Rail",
        label: "cards in",
        start: beat("railIn"),
        length: beat("step0") - beat("railIn"),
        follows: "shrink",
        beats: { stagger: 3 },
      },
    );
    const steps = STEPS.slice(0, last + 1);
    steps.forEach((s, k) => {
      elements.push({
        id: `step:${k}`,
        lane: "Rail",
        label: stats[k]?.value ?? `step ${k + 1}`,
        start: beat(s),
        length: k < steps.length - 1 ? beat(steps[k + 1]) - beat(s) : LAST_STEP,
        follows: k > 0 ? `step:${k - 1}` : "rail",
      });
    });
    const lastStep = beat(STEPS[Math.min(last, 3)] as BeatName);
    elements.push({
      id: "pay",
      lane: "Payoff",
      label: "payoff",
      start: lastStep + 1,
      length: 8,
      follows: `step:${steps.length - 1}`,
      beats: { chip: 1 },
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
