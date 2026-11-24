import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A highlight-reel title card: light bars streak in and park at the frame
// edges, the banner slices open with the title, the player slams in (the
// impact flashes and shakes the scene) with the role badge, the role label
// wipes in, the stat plate flashes on and wide bars sweep behind it all.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type PlayOfTheGameElementId =
  | "bars"
  | "banner"
  | "player"
  | "badge"
  | "role"
  | "stat"
  | "sweep";

/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 4;
const BARS_LEN = 12;
const BANNER_AT = 3;
const BANNER_LEN = 7;
const NAME_AT = 18;
const NAME_LEN = 5;
const GLYPH_AT = 20;
const ROLE_AT = 28;
const STAT_AT = 38;
const SWEEP_AT = 44;
const SWEEP_LEN = 18;

// `bars` streaks each parked bar in over `streak`, a few frames apart.
// `banner` slices the banner open over its length; the title slides in from
// `titleAt` over `title`. `player` slams the player in over its length,
// fading over `fade`; its end is the impact, which shakes the scene for
// `shake` frames. `badge` slams the role badge in, fading over `fade`.
// `role` wipes the role label in. `stat` brings the stat plate in over its
// length, flashing twice, with a smaller shake from `shakeAt` for `shake`
// frames. `sweep` passes the wide bars across.
export const playOfTheGameTimeline = defineTimeline<
  PlayOfTheGameElementId,
  object
>((): TimelineElement<PlayOfTheGameElementId>[] => [
  {
    id: "bars",
    lane: "Bars",
    label: "Bars in",
    start: 0 - PREROLL,
    length: BARS_LEN,
    beats: { streak: BARS_LEN - 2 },
  },
  {
    id: "banner",
    lane: "Banner",
    label: "Banner",
    start: BANNER_AT - PREROLL,
    length: BANNER_LEN,
    beats: { titleAt: 2, title: 14 },
  },
  {
    id: "player",
    lane: "Player",
    label: "Slam",
    start: NAME_AT - PREROLL,
    length: NAME_LEN,
    beats: { fade: 2, shake: 11 },
  },
  {
    id: "badge",
    lane: "Badge",
    label: "Badge",
    start: GLYPH_AT - PREROLL,
    length: NAME_LEN,
    follows: "player",
    beats: { fade: 2 },
  },
  {
    id: "role",
    lane: "Player",
    label: "Role",
    start: ROLE_AT - PREROLL,
    length: 9,
    follows: "player",
  },
  {
    id: "stat",
    lane: "Stat",
    label: "Stat",
    start: STAT_AT - PREROLL,
    length: 12,
    follows: "role",
    beats: { shakeAt: 6, shake: 6 },
  },
  {
    id: "sweep",
    lane: "Bars",
    label: "Sweep",
    start: SWEEP_AT - PREROLL,
    length: SWEEP_LEN,
    follows: "stat",
  },
]);
