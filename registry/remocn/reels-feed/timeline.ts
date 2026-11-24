import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A phone walks through a launch on Instagram: the finger taps a story ring,
// the story opens and plays three slides (the last one a poll the finger
// votes on), a swipe up brings in the reel and a double tap likes it. The
// copy beside the phone changes per chapter. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type ReelsFeedElementId =
  | `line:${number}`
  | "tap"
  | "open"
  | `story:${number}`
  | "poll"
  | "swipe"
  | "reel"
  | "like";

/** The scene's timing does not depend on its props. */
export type ReelsFeedTimingProps = object;

const CHAPTERS = ["Story", "Poll", "Reel"];
const LINE_AT = [0, 136, 206];
const TAP_STORY = 34;
const OPEN = 37;
const SEG = [44, 96, 144, 200];
const POLL_TAP = 170;
const SWIPE = 200;
const REEL = 214;
const DT = 240;

// Beats are offsets from the element's start: the finger appears (`appear`,
// `show`), travels in (`approach`, `arrive`) and hides (`hide`) around each
// press; the story ring dips and springs back (`dip`, `pressed`, `release`).
// A copy line rises from `inAt` to `in` and leaves over `out` at its end; the
// last one stays to the end of the clip.
export const reelsFeedTimeline = defineTimeline<
  ReelsFeedElementId,
  ReelsFeedTimingProps
>((_, { length }): TimelineElement<ReelsFeedElementId>[] => [
  {
    id: "line:0",
    lane: "Copy",
    label: CHAPTERS[0],
    start: LINE_AT[0],
    length: LINE_AT[1] - LINE_AT[0],
    beats: { inAt: 14, in: 30, out: 8 },
  },
  {
    id: "tap",
    lane: "Finger",
    label: "tap the story",
    start: TAP_STORY,
    length: 8,
    beats: {
      appear: -14,
      arrive: -2,
      hide: 4,
      dip: -1,
      pressed: 2,
      release: 8,
    },
  },
  {
    id: "open",
    lane: "Phone",
    label: "open the story",
    start: OPEN,
    length: 16,
    follows: "tap",
    beats: { bar: 4, status: 8 },
  },
  {
    id: "story:0",
    lane: "Phone",
    label: "product slide",
    start: SEG[0],
    length: SEG[1] - SEG[0],
    follows: "open",
  },
  {
    id: "story:1",
    lane: "Phone",
    label: "launch slide",
    start: SEG[1],
    length: SEG[2] - SEG[1],
    follows: "story:0",
  },
  {
    id: "line:1",
    lane: "Copy",
    label: CHAPTERS[1],
    start: LINE_AT[1],
    length: LINE_AT[2] - LINE_AT[1],
    follows: "line:0",
    beats: { inAt: 4, in: 20, out: 8 },
  },
  {
    id: "story:2",
    lane: "Phone",
    label: "poll slide",
    start: SEG[2],
    length: SEG[3] - SEG[2],
    follows: "story:1",
  },
  {
    id: "poll",
    lane: "Finger",
    label: "vote",
    start: POLL_TAP,
    length: 16,
    follows: "story:1",
    beats: {
      approach: -16,
      show: -14,
      arrive: -2,
      hide: 4,
      voteAt: 1,
      vote: 16,
    },
  },
  {
    id: "swipe",
    lane: "Phone",
    label: "swipe to the reel",
    start: SWIPE,
    length: REEL - SWIPE,
    follows: "story:2",
    beats: { show: -8, approach: -6, hold: -2, land: -2 },
  },
  {
    id: "line:2",
    lane: "Copy",
    label: CHAPTERS[2],
    start: LINE_AT[2],
    length: Math.max(0, length - LINE_AT[2]),
    follows: "line:1",
    beats: { inAt: 4, in: 20, out: 8 },
  },
  {
    id: "reel",
    lane: "Phone",
    label: "reel",
    start: REEL,
    length: 120,
    follows: "swipe",
  },
  {
    id: "like",
    lane: "Finger",
    label: "double tap",
    start: DT,
    length: 40,
    follows: "swipe",
    beats: {
      show: -12,
      approach: -10,
      hide: 12,
      second: 6,
      burst: 6,
      liked: 7,
      tickAt: 8,
      tick: 16,
      outAt: 26,
      out: 40,
    },
  },
]);
