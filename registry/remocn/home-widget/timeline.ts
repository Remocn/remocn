import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rises in and a finger reaches for the home screen: it holds a
// spot (the icons start to jiggle), taps the plus (the widget gallery slides
// up), taps the app's row (its page pushes in), swipes to the medium size,
// taps Add Widget (the widget flies into its slot and the apps shuffle
// aside), taps Done, and the widget comes alive. The copy lines beside the
// phone change with the beats. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type HomeWidgetElementId =
  | "phone"
  | `line:${number}`
  | "reach"
  | "hold"
  | "edit"
  | "plus"
  | "row"
  | "swipe"
  | "add"
  | "done"
  | "live";

export interface HomeWidgetTimingProps {
  size?: "small" | "medium";
}

const T_REACH = 16;
const T_HOLD = 30;
const T_JIG = 46;
const T_PLUS = 66;
const T_ROW = 100;
const T_SWIPE = 122;
const T_SWIPE_UP = 132;
const T_ADD = 158;
const T_DONE = 198;
const T_LIVE = 206;

// `phone` springs the phone up from below. `line:<i>` brings copy line `i`
// in over `rise` and out over `out` before its end (a chain; the last one
// stays). On the finger's lane: `reach` fades the finger in over `fadeIn`;
// `hold` presses from `pressIn` to `press` and lifts from `liftAt` to
// `lift`; `plus` taps the plus and slides the gallery up from `sheetAt` to
// `sheetEnd`; `row` taps the app's row, pushes its page in from `pushAt` to
// `pushEnd` and zooms the camera in from `camAt` to `camEnd`; `swipe` (medium
// size only) presses from `pressIn`, drags the page to `up`, lets it settle
// over `settle` and lifts at `lift`; `add` taps Add Widget at `tap` (the
// camera zooms back out from `camAt` to `camEnd`), flies the widget in with
// a spring, slides the gallery away from `sheetAt` to `sheetEnd` and
// shuffles the apps over `shuffle`, `stagger` apart; `done` taps Done, stops
// the jiggle from `stopAt` to `stopEnd` and the badges by `badgesEnd`, fades
// the finger from `fadeAt` to `fadeEnd` and pushes the camera onto the
// widget from `camAt` to `camEnd`. `edit` starts the jiggle over its length
// and the badges over `badges`. `live` counts the stat up over its length.
export const homeWidgetTimeline = defineTimeline<
  HomeWidgetElementId,
  HomeWidgetTimingProps
>(({ size = "medium" }) => {
  const medium = size === "medium";
  const lineAt = [6, T_PLUS, T_ADD + 4];
  const elements: TimelineElement<HomeWidgetElementId>[] = [
    { id: "phone", lane: "Phone", label: "Rise", start: 0, length: 30 },
    {
      id: "reach",
      lane: "Finger",
      label: "Reach",
      start: T_REACH,
      length: T_HOLD - T_REACH,
      beats: { fadeIn: 6 },
    },
    {
      id: "hold",
      lane: "Finger",
      label: "Hold",
      start: T_HOLD,
      length: T_PLUS - T_HOLD,
      follows: "reach",
      beats: { pressIn: -1, press: 1, liftAt: 20, lift: 22 },
    },
    {
      id: "edit",
      lane: "Home",
      label: "Jiggle",
      start: T_JIG,
      length: 6,
      follows: "hold",
      beats: { badges: 5 },
    },
    {
      id: "plus",
      lane: "Finger",
      label: "Tap plus",
      start: T_PLUS,
      length: T_ROW - T_PLUS,
      follows: "hold",
      beats: { sheetAt: 2, sheetEnd: 14 },
    },
    {
      id: "row",
      lane: "Finger",
      label: "Pick the app",
      start: T_ROW,
      length: (medium ? T_SWIPE : T_ADD - 1) - T_ROW,
      follows: "plus",
      beats: { pushAt: 2, pushEnd: 13, camAt: 4, camEnd: 20 },
    },
  ];
  if (medium) {
    elements.push({
      id: "swipe",
      lane: "Finger",
      label: "Swipe to medium",
      start: T_SWIPE,
      length: T_ADD - 1 - T_SWIPE,
      follows: "row",
      beats: { pressIn: -2, up: T_SWIPE_UP - T_SWIPE, settle: 12, lift: 2 },
    });
  }
  elements.push(
    {
      id: "add",
      lane: "Finger",
      label: "Add Widget",
      start: T_ADD,
      length: T_DONE - T_ADD,
      follows: medium ? "swipe" : "row",
      beats: {
        tap: -1,
        camAt: -6,
        camEnd: 10,
        sheetAt: 1,
        sheetEnd: 12,
        stagger: 0.25,
        shuffle: 14,
      },
    },
    {
      id: "done",
      lane: "Finger",
      label: "Done",
      start: T_DONE,
      length: T_LIVE - T_DONE,
      follows: "add",
      beats: {
        stopAt: 1,
        stopEnd: 6,
        badgesEnd: 5,
        fadeAt: 3,
        fadeEnd: 8,
        camAt: 4,
        camEnd: 26,
      },
    },
    {
      id: "live",
      lane: "Home",
      label: "Live widget",
      start: T_LIVE,
      length: 50,
      follows: "done",
    },
  );
  lineAt.forEach((at, i) => {
    const next = lineAt[i + 1];
    elements.push({
      id: `line:${i}`,
      lane: "Copy",
      label: `Line ${i + 1}`,
      start: at,
      length: next === undefined ? 14 : next - at,
      follows: i > 0 ? `line:${i - 1}` : undefined,
      beats: { rise: 14, out: 8 },
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
