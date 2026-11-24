import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The level-up: the XP bar building, the chips flying into it, the bar
// maxing out and collapsing, the call erupting, ducking to a kicker over the
// level number, the digit rolling up, then the stat line and logo. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type LevelUpElementId =
  | "bar"
  | `chip:${number}`
  | "max"
  | "collapse"
  | "burst"
  | "duck"
  | "roll"
  | "stat";

export interface LevelUpTimingProps {
  chips?: readonly number[];
}

export const DEFAULT_CHIPS = [120, 240, 180, 300, 360];
const BAR_AT = 0;
const CHIP_FLY = 12;
const ARRIVALS = [18, 25, 31, 37, 42];
const FILL_LEN = 6;
const MAX_AT = 48;
const COLLAPSE_AT = 51;
const COLLAPSE_LEN = 7;
const BURST_AT = 58;
const DUCK_AT = 68;
const DUCK_LEN = 8;
const ROLL_AT = 82;
const ROLL_LEN = 8;
const STAT_AT = 94;
const STAT_LEN = 12;

// `bar` builds the segments `segment` apart, each over `appear`, and slides
// the labels in from `labelsAt` over `labels`. `chip:<i>` flies chip i into
// the bar and hits at its end: it appears over `appear`, fades from `fadeAt`
// over `fade`, is gone at `gone`, and the bar fills over `fill` after the
// hit; the chips form a chain. `max` flashes the full bar over `flash`.
// `collapse` folds the bar into the centre, its labels leaving over
// `labels`. `burst` erupts the call (in over `title`, fading in over
// `fade`), the rays fade in over `raysFade` and they and the ring spread
// over its length, the glow comes in from `glowAt` over `glow` and the rays
// dim from `raysAt` over `rays`. `duck` takes the call up to a kicker and
// raises the level number from `numAt` over `num`. `roll` rolls the digit up; its kick lasts `kick` after it
// lands. `stat` slides the stat line in, counts it from `countAt` over
// `count` and raises the logo from `logoAt` over `logo`.
export const levelUpTimeline = defineTimeline<
  LevelUpElementId,
  LevelUpTimingProps
>(({ chips = DEFAULT_CHIPS }) => {
  const arrivals = chips.map(
    (_, i) => ARRIVALS[i] ?? ARRIVALS[ARRIVALS.length - 1] + (i - 4) * 5,
  );
  const elements: TimelineElement<LevelUpElementId>[] = [
    {
      id: "bar",
      lane: "Bar",
      label: "bar builds",
      start: BAR_AT,
      length: 12,
      beats: { segment: 0.8, appear: 6, labelsAt: 3, labels: 9 },
    },
  ];
  chips.forEach((v, i) => {
    elements.push({
      id: `chip:${i}`,
      lane: "Chips",
      label: `+${v}`,
      start: arrivals[i] - CHIP_FLY,
      length: CHIP_FLY,
      follows: i > 0 ? `chip:${i - 1}` : undefined,
      beats: { appear: 4, fadeAt: 10, fade: 3, gone: 13, fill: FILL_LEN },
    });
  });
  const lastChip: LevelUpElementId | undefined = chips.length
    ? `chip:${chips.length - 1}`
    : undefined;
  elements.push(
    {
      id: "max",
      lane: "Bar",
      label: "max",
      start: MAX_AT,
      length: COLLAPSE_AT - MAX_AT,
      follows: lastChip,
      beats: { flash: 6 },
    },
    {
      id: "collapse",
      lane: "Bar",
      label: "collapse",
      start: COLLAPSE_AT,
      length: COLLAPSE_LEN,
      follows: "max",
      beats: { labels: 4 },
    },
    {
      id: "burst",
      lane: "Call",
      label: "level up",
      start: BURST_AT,
      length: 16,
      follows: "collapse",
      beats: {
        title: 7,
        fade: 2,
        raysFade: 3,
        glowAt: 4,
        glow: 10,
        raysAt: 8,
        rays: 14,
      },
    },
    {
      id: "duck",
      lane: "Call",
      label: "duck",
      start: DUCK_AT,
      length: DUCK_LEN,
      follows: "burst",
      beats: { numAt: 5, num: 10 },
    },
    {
      id: "roll",
      lane: "Level",
      label: "roll",
      start: ROLL_AT,
      length: ROLL_LEN,
      follows: "duck",
      beats: { kick: 10 },
    },
    {
      id: "stat",
      lane: "Stat",
      label: "stat",
      start: STAT_AT,
      length: 10,
      follows: "roll",
      beats: { countAt: 2, count: STAT_LEN, logoAt: 6, logo: 10 },
    },
  );
  return elements;
});
