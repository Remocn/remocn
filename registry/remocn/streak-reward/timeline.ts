import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rising with the flame and the streak number, the week filling in
// up to yesterday, today's ring closing as the number rolls up, the note
// swapping, then a touch pressing Continue: the reward screen slides in with
// its medal, title and stats under a slow camera push. Two copy lines beside
// the phone carry the streak beat, then the reward beat. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type StreakRewardElementId =
  | "phone"
  | "flame"
  | "number"
  | `line:${number}`
  | "week"
  | "today"
  | "note"
  | "touch"
  | "press"
  | "swap"
  | "medal"
  | "camera"
  | "title"
  | "stats";

/** The scene's timing does not depend on its props. */
export type StreakRewardTimingProps = object;

// `phone` rises the phone in on a spring. `flame` pops the flame, `number`
// fades the streak number up over its length. `line:<i>` is copy line i
// beside the phone, rising in over `in`; the first leaves over `out`, `lead`
// frames before the second arrives. `week` slides the week in, filling each
// past day from `day`, `stagger` apart. `today` closes today's ring, popping
// it at `pop`, rolls the number up at `roll`, flares the flame and settles
// it at `settle`, and raises Continue at `cta`. `note` swaps the note over
// its length. `touch` brings the touch in (fading from `fadeIn` to
// `fadeInEnd`) and moves it onto the button over its length. `press` presses
// Continue, releasing at `release`; the touch fades from `fade` to
// `fadeEnd`. `swap` slides the reward screen in. `medal` pops the medal and
// runs its sheen from `sheen` to `sheenEnd`; `camera` pushes in over its
// length. `title` fades the title in, the subtitle from `sub` to `subEnd`.
// `stats` pops each stat `stagger` apart and counts it up from `count` over
// `countLen`, `countStagger` apart; the footer fades from `footer` to
// `footerEnd`.
export const streakRewardTimeline = defineTimeline<
  StreakRewardElementId,
  StreakRewardTimingProps
>((): TimelineElement<StreakRewardElementId>[] => [
  { id: "phone", lane: "Phone", label: "Phone", start: 0, length: 30 },
  { id: "flame", lane: "Streak", label: "Flame", start: 6, length: 20 },
  { id: "number", lane: "Streak", label: "Number", start: 12, length: 14 },
  {
    id: "line:0",
    lane: "Copy",
    label: "Streak line",
    start: 16,
    length: 76,
    beats: { in: 16, out: 8 },
  },
  {
    id: "week",
    lane: "Streak",
    label: "Week",
    start: 18,
    length: 30,
    beats: { day: 4, stagger: 3 },
  },
  {
    id: "today",
    lane: "Streak",
    label: "Today",
    start: 48,
    length: 12,
    follows: "week",
    beats: { pop: 6, roll: 2, settle: 8, cta: 12 },
  },
  {
    id: "note",
    lane: "Streak",
    label: "Note",
    start: 60,
    length: 12,
    follows: "today",
  },
  {
    id: "touch",
    lane: "Touch",
    label: "Touch",
    start: 66,
    length: 16,
    follows: "today",
    beats: { fadeIn: -4, fadeInEnd: 4 },
  },
  {
    id: "press",
    lane: "Touch",
    label: "Press",
    start: 84,
    length: 14,
    follows: "touch",
    beats: { release: 5, fade: 6, fadeEnd: 14 },
  },
  {
    id: "swap",
    lane: "Reward",
    label: "Reward screen",
    start: 88,
    length: 8,
    follows: "press",
  },
  {
    id: "line:1",
    lane: "Copy",
    label: "Reward line",
    start: 90,
    length: 16,
    follows: "swap",
    beats: { in: 16, lead: -6 },
  },
  {
    id: "medal",
    lane: "Reward",
    label: "Medal",
    start: 96,
    length: 34,
    follows: "swap",
    beats: { sheen: 12, sheenEnd: 34 },
  },
  {
    id: "camera",
    lane: "Camera",
    label: "Push",
    start: 96,
    length: 84,
    follows: "swap",
  },
  {
    id: "title",
    lane: "Reward",
    label: "Title",
    start: 102,
    length: 14,
    follows: "medal",
    beats: { sub: 4, subEnd: 18 },
  },
  {
    id: "stats",
    lane: "Reward",
    label: "Stats",
    start: 108,
    length: 34,
    follows: "title",
    beats: {
      stagger: 3,
      count: 4,
      countLen: 26,
      countStagger: 6,
      footer: 20,
      footerEnd: 34,
    },
  },
]);
