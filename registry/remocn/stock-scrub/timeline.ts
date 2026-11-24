import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The phone rising in with the stock page, the chart drawing, the copy lines
// beside the phone, then the finger: it reaches the chart, presses and
// scrubs left and right, releases, taps the 1Y tab and taps Buy. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type StockScrubElementId =
  | "page"
  | "camera"
  | "draw"
  | `line:${number}`
  | "reach"
  | "press"
  | "left"
  | "right"
  | "release"
  | "tab"
  | "buy";

const DRAW = 8;
const REACH = 52;
const PRESS = 72;
const LEFT = 112;
const RIGHT = 146;
const RELEASE = 154;
const TAB_TAP = 174;
const BUY_TAP = 214;
/** A tap presses from `pressIn` and releases at `pressOut`, around its frame. */
const TAP = { pressIn: -1, pressOut: 5 };

// `page` rises the phone in; the header rows come in from `headAt`, `head`
// apart, the readout at `readAt` and the stats at `statsAt`. `camera` is the
// slow push across the clip. `draw` draws the day's line over its length.
// `line:<i>` brings copy line `i` in over `rise` and takes it out from
// `outLead` before its end to `out` after it (a chain). `reach` brings the
// finger in, fading over `fadeIn`. `press` lands on the chart and holds for
// `hold`: the finger presses down from `heldAt` to `heldEnd`, the crosshair
// shows from `crossAt` to `crossEnd`. `left` drags to the left and holds for
// `hold`; `right` drags back right. `release` lifts the finger, the drag
// drifting on from `drift` and the crosshair settling over `settle`. `tab`
// taps 1Y and holds for `hold`; the tab slides from `slideAt`, the chart
// morphs to the year from `morphAt` over `morph`. `buy` taps Buy: the sheet
// rises from `sheetAt`, its rows from `rowsAt`, `row` apart, and the finger
// fades from `fadeAt` to `fadeEnd`. Each gesture follows the one before.
export const stockScrubTimeline = defineTimeline<StockScrubElementId, object>(
  () => {
    const beats = [0, PRESS - 6, TAB_TAP - 4, BUY_TAP];
    const lineAt = beats.map((at, i) => at + (i === 0 ? 8 : 0));
    const elements: TimelineElement<StockScrubElementId>[] = [
      {
        id: "page",
        lane: "Phone",
        label: "Stock page",
        start: 0,
        length: 24,
        beats: { headAt: 6, head: 3, readAt: 18, statsAt: 24 },
      },
      { id: "camera", lane: "Camera", label: "Push-in", start: 0, length: 270 },
      { id: "draw", lane: "Phone", label: "Chart", start: DRAW, length: 40 },
      {
        id: "reach",
        lane: "Finger",
        label: "Reach",
        start: REACH,
        length: PRESS - REACH,
        beats: { fadeIn: 8 },
      },
      {
        id: "press",
        lane: "Finger",
        label: "Press",
        start: PRESS,
        length: LEFT - PRESS,
        follows: "reach",
        beats: { hold: 4, heldAt: -2, heldEnd: 2, crossAt: -1, crossEnd: 4 },
      },
      {
        id: "left",
        lane: "Finger",
        label: "Scrub left",
        start: LEFT,
        length: RIGHT - LEFT,
        follows: "press",
        beats: { hold: 8 },
      },
      {
        id: "right",
        lane: "Finger",
        label: "Scrub right",
        start: RIGHT,
        length: RELEASE - RIGHT,
        follows: "left",
      },
      {
        id: "release",
        lane: "Finger",
        label: "Release",
        start: RELEASE,
        length: TAB_TAP - RELEASE,
        follows: "right",
        beats: { drift: -3, heldAt: -2, heldEnd: 2, settle: 6 },
      },
      {
        id: "tab",
        lane: "Finger",
        label: "Tap 1Y",
        start: TAB_TAP,
        length: BUY_TAP - TAB_TAP,
        follows: "release",
        beats: { ...TAP, hold: 4, slideAt: 1, morphAt: 3, morph: 22 },
      },
      {
        id: "buy",
        lane: "Finger",
        label: "Tap Buy",
        start: BUY_TAP,
        length: 22,
        follows: "tab",
        beats: {
          ...TAP,
          sheetAt: 4,
          rowsAt: 10,
          row: 3,
          fadeAt: 4,
          fadeEnd: 10,
        },
      },
    ];
    lineAt.forEach((at, i) => {
      const next = lineAt[i + 1];
      elements.push({
        id: `line:${i}`,
        lane: "Copy",
        label: `Line ${i + 1}`,
        start: at,
        length: next === undefined ? 14 : next - at,
        follows: i > 0 ? `line:${i - 1}` : undefined,
        beats: { rise: 14, outLead: 2, out: 6 },
      });
    });
    return elements
      .map((e, k) => ({ e, k }))
      .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
      .map(({ e }) => e);
  },
);
