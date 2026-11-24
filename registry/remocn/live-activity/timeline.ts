import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rising in, the Live Activity blooming out of the Dynamic Island
// and counting down, the camera zooming to the island and back, then the
// finger: it presses the island open, taps it closed, swipes the Lock Screen
// down to reveal the activity card, and the countdown finishes. The copy
// lines beside the phone change with the beats. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type LiveActivityElementId =
  | "phone"
  | `line:${number}`
  | "countdown"
  | "zoom-in"
  | "reach"
  | "press"
  | "expand"
  | "collapse"
  | "zoom-out"
  | "swipe"
  | "release"
  | "push"
  | "finish";

const T_START = 14;
const T_REACH = 40;
const T_PRESS = 54;
const T_EXP = 62;
const T_COL = 150;
const T_SWIPE = 190;
const T_RELEASE = 202;
const T_FIN = 240;
const LINE_AT = [0, T_EXP, T_SWIPE];
/** The camera's moves: in to the island, back out, and a last push. */
const ZOOM_IN = [22, 46];
const ZOOM_OUT = [160, 182];
const PUSH = [204, 226];

// `phone` rises the phone in. `line:<i>` brings copy line `i` in over
// `rise` (the first rides the phone) and out over the `outLead` frames
// before its end (a chain). `countdown` blooms the island and counts down
// over its length; `finish` marks it done at `doneAt`. The camera zooms in
// to the island (`zoom-in`), back out (`zoom-out`) and pushes to the card
// (`push`). `reach` brings the finger in, fading over `fadeIn`. `press`
// holds the island down from its start to `down`, popping it at `bumpAt`.
// `expand` opens the activity; the finger lifts from `upAt` to `upEnd` and
// fades from `fadeAt` to `fadeEnd`. `collapse` closes it: the finger shows
// from `showAt` to `showEnd`, taps at `tapAt` and fades from `fadeAt` to
// `fadeEnd`. `swipe` pulls the Lock Screen over its length: the finger
// approaches from `approachAt` (showing until `showEnd`), presses from
// `downAt`, and the island's bloom goes at `unbloomAt`. `release` lets go:
// the sheet settles over `rest`, the finger lifts by `upEnd` and fades from
// `fadeAt` to `fadeEnd`, and the card comes in at `cardAt`. The finger's
// steps follow one another; the zoom out follows the collapse and the push
// the release.
export const liveActivityTimeline = defineTimeline<
  LiveActivityElementId,
  object
>(() => {
  const elements: TimelineElement<LiveActivityElementId>[] = [
    {
      id: "phone",
      lane: "Phone",
      label: "Phone",
      start: 0,
      length: T_START,
    },
    {
      id: "countdown",
      lane: "Activity",
      label: "Countdown",
      start: T_START,
      length: T_FIN - T_START,
    },
    {
      id: "zoom-in",
      lane: "Camera",
      label: "Zoom in",
      start: ZOOM_IN[0],
      length: ZOOM_IN[1] - ZOOM_IN[0],
    },
    {
      id: "reach",
      lane: "Finger",
      label: "Reach",
      start: T_REACH,
      length: T_PRESS - T_REACH,
      beats: { fadeIn: 6 },
    },
    {
      id: "press",
      lane: "Finger",
      label: "Press the island",
      start: T_PRESS,
      length: T_EXP - T_PRESS,
      follows: "reach",
      beats: { down: 2, bumpAt: 2 },
    },
    {
      id: "expand",
      lane: "Finger",
      label: "Expand",
      start: T_EXP,
      length: T_COL - T_EXP,
      follows: "press",
      beats: { upAt: 2, upEnd: 4, fadeAt: 4, fadeEnd: 9 },
    },
    {
      id: "collapse",
      lane: "Finger",
      label: "Collapse",
      start: T_COL,
      length: T_SWIPE - T_COL,
      follows: "expand",
      beats: {
        tapAt: -1,
        showAt: -10,
        showEnd: -5,
        fadeAt: 3,
        fadeEnd: 8,
      },
    },
    {
      id: "zoom-out",
      lane: "Camera",
      label: "Zoom out",
      start: ZOOM_OUT[0],
      length: ZOOM_OUT[1] - ZOOM_OUT[0],
      follows: "collapse",
    },
    {
      id: "swipe",
      lane: "Finger",
      label: "Swipe down",
      start: T_SWIPE,
      length: T_RELEASE - T_SWIPE,
      follows: "collapse",
      beats: {
        approachAt: -10,
        showEnd: -5,
        downAt: -2,
        unbloomAt: 4,
      },
    },
    {
      id: "release",
      lane: "Finger",
      label: "Release",
      start: T_RELEASE,
      length: T_FIN - T_RELEASE,
      follows: "swipe",
      beats: { rest: 11, upEnd: 2, fadeAt: 2, fadeEnd: 7, cardAt: -2 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push to the card",
      start: PUSH[0],
      length: PUSH[1] - PUSH[0],
      follows: "release",
    },
    {
      id: "finish",
      lane: "Activity",
      label: "Done",
      start: T_FIN,
      length: 12,
      follows: "countdown",
      beats: { doneAt: 2 },
    },
  ];
  LINE_AT.forEach((at, i) => {
    const next = LINE_AT[i + 1];
    elements.push({
      id: `line:${i}`,
      lane: "Copy",
      label: `Line ${i + 1}`,
      start: at,
      length: next === undefined ? 12 : next - at,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { rise: 12, outLead: 7 },
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
