import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The browser window rising in, the cursor clicking the extension, the popup
// reading the page and highlighting it, the summary, then the cursor saving
// the page, the saved state, the popup closing and the toast. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type BrowserExtensionElementId =
  | "page"
  | "camera"
  | "cursor"
  | "click"
  | "read"
  | `hl:${number}`
  | "summary"
  | "move"
  | "save"
  | "saved"
  | "close"
  | "toast";

export interface BrowserExtensionTimingProps {
  highlights?: string[];
}

export const DEFAULT_HIGHLIGHTS = [
  "they were the ones with the shortest distance between a decision and a deploy.",
  "Small teams win because context never has to travel.",
  "A team that ships twenty small releases learns twenty times",
];

const T = {
  click: 30,
  read: 36,
  hl: [54, 66, 78],
  sum: 84,
  toSave: 108,
  save: 126,
  saved: 138,
  close: 160,
  toast: 162,
};
/** A click presses from `pressIn` and releases at `pressOut`, around its frame. */
const PRESS = { pressIn: -2, pressOut: 2 };

// `page` rises the window in. `camera` is the slow push across the clip.
// `cursor` fades the cursor in over `fadeIn` and starts it moving at
// `moveAt`. `click` clicks the extension: the cursor arrives at `arriveAt`
// after hovering from `hoverAt`, and the popup opens from `openAt`, fading
// in over `popIn`. `read` runs the reading bar over its length; the status
// lines fade in from `statusAt` over `status`. `hl:<i>` sweeps highlight `i`
// over its length (a chain); it counts as done after `count`, and the first
// one fades the reading bar out over `barOut`. The page scrolls from
// `hl:1`'s `scrollAt` to `hl:2`'s `scrollEnd`. `summary` brings the points
// in, `item` apart, each over `itemIn`; the status lines leave from
// `statusOutAt` to `statusOutEnd` and are gone at `statusGone`. `move`
// takes the cursor off the extension (unhovered from `unhoverAt` to
// `unhoverEnd`) towards Save. `save` clicks it: the cursor arrives at
// `arriveAt`, the button hovers from `hoverAt` to `hoverEnd` and spins from
// `spinAt`. `saved` shows the saved state; the cursor leaves from `leaveAt`
// to `exitAt` and fades from `fadeAt` to `fadeEnd`. `close` closes the
// popup and `toast` pops the toast.
export const browserExtensionTimeline = defineTimeline<
  BrowserExtensionElementId,
  BrowserExtensionTimingProps
>(({ highlights = DEFAULT_HIGHLIGHTS }) => {
  const hlAt = Array.from(
    { length: Math.max(T.hl.length, highlights.length) },
    (_, i) => T.hl[i] ?? T.hl[T.hl.length - 1] + i * 10,
  );
  const last = T.hl.length - 1;
  const elements: TimelineElement<BrowserExtensionElementId>[] = [
    { id: "page", lane: "Browser", label: "Window", start: 0, length: 6 },
    { id: "camera", lane: "Camera", label: "Push-in", start: 0, length: 200 },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: 4,
      length: T.click - 4,
      beats: { fadeIn: 6, moveAt: 2 },
    },
    {
      id: "click",
      lane: "Cursor",
      label: "Click the extension",
      start: T.click,
      length: T.read - T.click,
      follows: "cursor",
      beats: { ...PRESS, arriveAt: -3, hoverAt: -7, openAt: 1, popIn: 4 },
    },
    {
      id: "read",
      lane: "Popup",
      label: "Reading",
      start: T.read,
      length: T.hl[0] - 2 - T.read,
      follows: "click",
      beats: { statusAt: 4, status: 6 },
    },
  ];
  hlAt.forEach((at, i) => {
    elements.push({
      id: `hl:${i}`,
      lane: "Highlights",
      label: highlights[i] ?? `Highlight ${i + 1}`,
      start: at,
      length: 12,
      follows: i > 0 ? `hl:${i - 1}` : "read",
      beats: { count: 6, barOut: 6, scrollAt: -4, scrollEnd: 6 },
    });
  });
  elements.push(
    {
      id: "summary",
      lane: "Popup",
      label: "Summary",
      start: T.sum,
      length: T.toSave - 12 - T.sum,
      follows: `hl:${last}`,
      beats: {
        item: 3,
        itemIn: 10,
        statusOutAt: -2,
        statusOutEnd: 4,
        statusGone: 6,
      },
    },
    {
      id: "move",
      lane: "Cursor",
      label: "To Save",
      start: T.toSave - 12,
      length: T.save - 3 - (T.toSave - 12),
      follows: "summary",
      beats: { unhoverAt: 2, unhoverEnd: 6 },
    },
    {
      id: "save",
      lane: "Cursor",
      label: "Save",
      start: T.save,
      length: T.saved - T.save,
      follows: "move",
      beats: { ...PRESS, arriveAt: -3, hoverAt: -6, hoverEnd: -2, spinAt: 1 },
    },
    {
      id: "saved",
      lane: "Popup",
      label: "Saved",
      start: T.saved,
      length: T.close - T.saved,
      follows: "save",
      beats: { leaveAt: 8, exitAt: 34, fadeAt: 28, fadeEnd: 36 },
    },
    {
      id: "close",
      lane: "Popup",
      label: "Close",
      start: T.close,
      length: 7,
      follows: "saved",
    },
    {
      id: "toast",
      lane: "Toast",
      label: "Toast",
      start: T.toast,
      length: 6,
      follows: "close",
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
