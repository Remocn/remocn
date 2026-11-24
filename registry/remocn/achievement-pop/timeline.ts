import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each achievement popping in and opening into a pill, the running total
// fading in, the stack settling into its poster and the logo rising in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type AchievementPopElementId =
  | `card:${number}`
  | "total"
  | "poster"
  | "logo";

/** One achievement, as the component's `Achievement`. */
export interface AchievementEntry {
  label: string;
  title: string;
  points: number;
  icon?: "trophy" | "bolt" | "star";
}

export interface AchievementPopTimingProps {
  achievements?: AchievementEntry[];
}

export const DEFAULT_ACHIEVEMENTS: AchievementEntry[] = [
  {
    label: "Unlocked · 64% of makers",
    title: "Shipped in one day",
    points: 100,
    icon: "trophy",
  },
  {
    label: "Unlocked · 23% of makers",
    title: "Zero keyframes by hand",
    points: 50,
    icon: "bolt",
  },
  {
    label: "Rare · 1.8% of makers",
    title: "Launch video shipped",
    points: 250,
    icon: "star",
  },
];

/** When each card pops in; the stack holds at most this many. */
export const CARD_STARTS = [4, 34, 58] as const;
const OPEN = 6;
const SHIFT_LEAD = 6;
const POSTER = 30;
const LOGO = 10;
const LOGO_RISE = 14;
const TOTAL_IN = 8;
const TOTAL_LEN = 14;

// `card:<i>` is achievement `i`, a chain. Its beats, from the pop: `shift`
// (the stack starts making room, before it), `appear`, `flash` and
// `flashEnd` (the ring), `open` and `openLen` (the pill opening), `text`,
// `points` and `sheen` with their ends, and `count` / `countEnd` (its
// points counting into the total). The poster follows the last card and
// the logo follows the poster.
export const achievementPopTimeline = defineTimeline<
  AchievementPopElementId,
  AchievementPopTimingProps
>(({ achievements = DEFAULT_ACHIEVEMENTS }) => {
  const list = achievements.slice(0, CARD_STARTS.length);
  const n = list.length;
  const starts = CARD_STARTS.slice(0, n);
  const lastStart = starts[n - 1] ?? CARD_STARTS[0];
  const posterAt = lastStart + POSTER;
  const elements: TimelineElement<AchievementPopElementId>[] = [];
  list.forEach((a, i) => {
    elements.push({
      id: `card:${i}`,
      lane: "Cards",
      label: a.title,
      start: starts[i],
      length: (i + 1 < n ? starts[i + 1] : posterAt) - starts[i],
      follows: i > 0 ? `card:${i - 1}` : undefined,
      beats: {
        shift: -SHIFT_LEAD,
        appear: 3,
        flash: 2,
        flashEnd: 16,
        open: OPEN,
        openLen: 16,
        text: OPEN + 4,
        textEnd: OPEN + 16,
        points: OPEN + 8,
        pointsEnd: OPEN + 20,
        sheen: OPEN + 14,
        sheenEnd: OPEN + 32,
        count: 10,
        countEnd: 22,
      },
    });
  });
  elements.push(
    {
      id: "total",
      lane: "Total",
      label: "Total",
      start: (starts[0] ?? CARD_STARTS[0]) + TOTAL_IN,
      length: TOTAL_LEN,
    },
    {
      id: "poster",
      lane: "Poster",
      label: "Poster",
      start: posterAt,
      length: LOGO,
      follows: n > 0 ? `card:${n - 1}` : undefined,
    },
    {
      id: "logo",
      lane: "Poster",
      label: "Logo",
      start: posterAt + LOGO,
      length: LOGO_RISE,
      follows: "poster",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
