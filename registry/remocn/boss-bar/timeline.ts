import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The bar wiping in and charging, each hit word slamming in and chunking the
// bar, the empty bar shattering, "DEFEATED" slamming in, the boss name gliding
// down over it and the logo. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type BossBarElementId =
  | "intro"
  | `hit:${number}`
  | "shatter"
  | "defeated"
  | "name"
  | "logo";

/** A hit as the schedule reads it (`BossHit`). */
export interface HitEntry {
  label: string;
  damage: number;
}

export interface BossBarTimingProps {
  hits?: HitEntry[];
  hitGap?: number;
  defeated?: string;
}

export const DEFAULT_HITS: HitEntry[] = [
  { label: "Captions", damage: 820 },
  { label: "Transitions", damage: 1140 },
  { label: "Templates", damage: 1040 },
];

const INTRO = 20;
export const FIRST_HIT = 30;
export const HIT_GAP = 26;
const SLAM_LEN = 5;
const TRAIL_HOLD = 7;
const TRAIL_DRAIN = 10;
const FLASH_DELAY = 4;
const SHATTER_DELAY = 6;
const DEFEAT_DELAY = 8;
const DEFEAT_LEN = 6;

// `intro` wipes the frame in over `frame`, charges the fill from `charge`
// and slides the name in from `name` over `nameIn`, the HP readout from `hp`
// over `hpIn`. `hit:<i>` slams its word in and ends on its impact, the
// moment the bar chunks down. The beats after the impact are durations
// counted from it: the trail holds and drains, the bar and the camera
// shake, the damage number pops, drifts off and is gone at `popLife`, the
// slash reaches and fades. The word leaves when the next hit starts.
// `shatter` breaks the bar (flashing white from `flash`); `defeated` ends
// on its impact, which shakes the camera and starts the glow and the
// settle. The hits form a chain; the rest follow the last hit.
export const bossBarTimeline = defineTimeline<
  BossBarElementId,
  BossBarTimingProps
>(
  ({
    hits = DEFAULT_HITS,
    hitGap = HIT_GAP,
    defeated = "DEFEATED",
  }): TimelineElement<BossBarElementId>[] => {
    const hitAt = hits.map((_, i) => FIRST_HIT + i * hitGap);
    const lastHit = hitAt[hitAt.length - 1] ?? FIRST_HIT;
    const shatterAt = lastHit + SHATTER_DELAY;
    const defeatAt = lastHit + DEFEAT_DELAY;
    const defeatHit = defeatAt + DEFEAT_LEN;
    const lastId: BossBarElementId | undefined =
      hits.length > 0 ? `hit:${hits.length - 1}` : undefined;
    return [
      {
        id: "intro",
        lane: "Bar",
        label: "bar in",
        start: 0,
        length: INTRO,
        beats: { frame: 10, charge: 6, name: 4, nameIn: 10, hp: 8, hpIn: 8 },
      },
      ...hits.map(
        (h, i): TimelineElement<BossBarElementId> => ({
          id: `hit:${i}`,
          lane: "Hits",
          label: h.label,
          start: hitAt[i] - SLAM_LEN,
          length: SLAM_LEN,
          follows: i > 0 ? `hit:${i - 1}` : undefined,
          beats: {
            fade: 2,
            outLead: -1,
            out: 4,
            hold: TRAIL_HOLD,
            drain: TRAIL_DRAIN,
            flash: 2,
            shake: 7,
            camera: 8,
            pop: 4,
            popFade: 2,
            popOut: 16,
            popOutLen: 8,
            popLife: 26,
            reach: 3,
            slashFade: 2,
            slash: 7,
          },
        }),
      ),
      {
        id: "shatter",
        lane: "Bar",
        label: "shatter",
        start: shatterAt,
        length: 20,
        follows: lastId,
        beats: {
          flash: FLASH_DELAY - SHATTER_DELAY,
          popOut: -2,
          popOutLen: 5,
          hpOut: 4,
          fadeAt: 8,
          life: 40,
        },
      },
      {
        id: "defeated",
        lane: "Defeat",
        label: defeated,
        start: defeatAt,
        length: DEFEAT_LEN,
        follows: lastId,
        beats: { clear: -3, fade: 2, shake: 14, settle: 70, glow: 18 },
      },
      {
        id: "name",
        lane: "Name",
        label: "name glides",
        start: defeatHit + 4,
        length: 12,
        follows: "defeated",
      },
      {
        id: "logo",
        lane: "Logo",
        label: "logo",
        start: defeatHit + 18,
        length: 10,
        follows: "defeated",
      },
    ];
  },
);
