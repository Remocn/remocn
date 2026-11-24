import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The App Store listing: the phone rises, the camera zooms onto the Get
// button, a finger taps it and the download fills its ring, the camera
// pulls back, the finger swipes the screenshots twice, the button turns to
// Open and the camera pushes in, while the lines beside the phone swap in
// step. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type AppStoreListingElementId =
  | "phone"
  | `line:${number}`
  | "zoomIn"
  | "finger"
  | "tap"
  | "download"
  | "zoomOut"
  | `swipe:${number}`
  | "done"
  | "push";

export interface AppStoreListingTimingProps {
  lines?: string[];
}

export const DEFAULT_LINES = [
  "Now on the App Store.",
  "One tap to install.",
  "Every screen, previewed.",
  "Open it. Ship today.",
];

const T_TAP = 40;
const T_PROG = 64;
const T_DONE = 150;
const DRAG = [
  { down: 104, up: 115 },
  { down: 131, up: 141 },
];
const LINE_AT = [0, T_TAP + 6, DRAG[0].down - 8, T_DONE];
/** How many lines the scene has slots for. */
export const LINE_SLOTS = LINE_AT.length;

// The camera holds between its moves: `zoomIn`, `zoomOut` and `push` are
// each one ease. The tap collapses the button and starts the spinner on its
// beats; `download` fills the ring through its keys `p1`…`p4`, and fills it
// completely `filled` before `done`. A swipe runs from finger down to finger
// up; the finger reaches the strip at `reachAt` before the first, shows from
// `showAt` and hides from `hideAt` after the last. A line rises over `in`
// and leaves `out` before the next line takes over.
export const appStoreListingTimeline = defineTimeline<
  AppStoreListingElementId,
  AppStoreListingTimingProps
>(({ lines = DEFAULT_LINES }): TimelineElement<AppStoreListingElementId>[] => {
  const shown = lines.slice(0, LINE_SLOTS);
  const elements: TimelineElement<AppStoreListingElementId>[] = [
    { id: "phone", lane: "Phone", label: "phone", start: 0, length: 20 },
    {
      id: "zoomIn",
      lane: "Camera",
      label: "zoom to Get",
      start: 20,
      length: 18,
    },
    {
      id: "finger",
      lane: "Finger",
      label: "finger in",
      start: 22,
      length: 6,
    },
    {
      id: "tap",
      lane: "Finger",
      label: "tap Get",
      start: T_TAP,
      length: T_PROG - T_TAP,
      follows: "finger",
      beats: {
        collapseAt: 2,
        collapseEnd: 10,
        ringAt: 6,
        ringEnd: 10,
        spinAt: 9,
        liftAt: 4,
        liftEnd: 9,
      },
    },
    {
      id: "download",
      lane: "Button",
      label: "download",
      start: T_PROG,
      length: T_DONE - T_PROG,
      follows: "tap",
      beats: { p1: 12, p2: 30, p3: 48, p4: 74 },
    },
    {
      id: "zoomOut",
      lane: "Camera",
      label: "zoom out",
      start: 86,
      length: 16,
      follows: "zoomIn",
    },
    {
      id: "swipe:0",
      lane: "Finger",
      label: "swipe",
      start: DRAG[0].down,
      length: DRAG[0].up - DRAG[0].down,
      beats: { reachAt: -9, showAt: -7, showEnd: -2 },
    },
    {
      id: "swipe:1",
      lane: "Finger",
      label: "swipe",
      start: DRAG[1].down,
      length: DRAG[1].up - DRAG[1].down,
      follows: "swipe:0",
      beats: {
        hideAt: DRAG[1].up - DRAG[1].down + 2,
        hideEnd: DRAG[1].up - DRAG[1].down + 7,
      },
    },
    {
      id: "done",
      lane: "Button",
      label: "open",
      start: T_DONE,
      length: 5,
      follows: "download",
      beats: { filled: -2, expandAt: 1, ringOutAt: 2, ringOutEnd: 5 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: 154,
      length: 18,
      follows: "done",
    },
  ];
  shown.forEach((line, i) => {
    const at = LINE_AT[i];
    const next = LINE_AT[i + 1];
    elements.push({
      id: `line:${i}`,
      lane: "Lines",
      label: line,
      start: at,
      length: next === undefined ? 30 : next - at,
      follows: i === 1 ? "tap" : i > 0 ? `line:${i - 1}` : undefined,
      beats: { in: 12, out: 7 },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
