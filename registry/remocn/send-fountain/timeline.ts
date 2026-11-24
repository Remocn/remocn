import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A prompt bar sends, and the app it builds fountains out of the button:
// the bar and cursor come in close up, the cursor presses Send, the button
// flips and the cards burst out one after another while the camera rises,
// then the cards snap into the app window, its chrome fades in, the avatars
// settle, the data counts up and the app goes live, under a slow push.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type SendFountainElementId =
  | "bar"
  | "cursor"
  | "zoom"
  | "press"
  | "flip"
  | `card:${number}`
  | "rise"
  | "snap"
  | "chrome"
  | "avatars"
  | "data"
  | "live";

/** The scene's timing does not depend on its props. */
export type SendFountainTimingProps = object;

/** Frames the default scene runs. */
export const FOUNTAIN_END = 144;
/** The cards, in the order they burst out of the button. */
const CARDS = ["Chart", "Hero", "Stat", "Icon", "Sketch", "Cover"];
const EJECT = [19, 24, 28, 32, 35, 38];
const SNAP = 68;

// `bar` drops the prompt bar in on a spring. `cursor` brings the cursor to
// the button over its length, fading in over `fade`. `zoom` eases the close
// camera back out over its length. `press` presses Send: down over `down`,
// up from `up` over `upLen`, the button springing back at `release`; the
// caret stops blinking at its start. `flip` turns the button over its
// length, flashing over `flash` and fading from `fade` over `fadeLen`.
// `card:<i>` bursts card i out of the button, its avatar popping at `pop`
// and the card drifting from `drift` until the snap; the cards form a chain.
// `rise` lifts the camera past the bar over its length. `snap` snaps the
// cards into the window, `stagger` apart, and pushes the camera in over its
// length. `chrome` fades the window chrome in. `avatars` sends the avatars
// to the top bar, `stagger` apart. `data` counts the stat up. `live` pops
// the live badge.
export const sendFountainTimeline = defineTimeline<
  SendFountainElementId,
  SendFountainTimingProps
>(() => {
  const elements: TimelineElement<SendFountainElementId>[] = [
    { id: "bar", lane: "Bar", label: "Prompt bar", start: -6, length: 20 },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: -4,
      length: 20,
      beats: { fade: 6 },
    },
    { id: "zoom", lane: "Camera", label: "Zoom out", start: -4, length: 40 },
    {
      id: "press",
      lane: "Cursor",
      label: "Send",
      start: 14,
      length: 2,
      beats: { down: 3, up: 3, upLen: 6, release: 4 },
    },
    {
      id: "flip",
      lane: "Bar",
      label: "Flip",
      start: 16,
      length: 4,
      follows: "press",
      beats: { flash: 3, fade: 4, fadeLen: 14 },
    },
    { id: "rise", lane: "Camera", label: "Rise", start: 22, length: 76 - 22 },
    {
      id: "snap",
      lane: "Window",
      label: "Snap",
      start: SNAP,
      length: FOUNTAIN_END - SNAP,
      beats: { stagger: 2 },
    },
    { id: "chrome", lane: "Window", label: "Chrome", start: 72, length: 16 },
    {
      id: "avatars",
      lane: "Window",
      label: "Avatars",
      start: 80,
      length: 6,
      beats: { stagger: 3 },
    },
    {
      id: "data",
      lane: "Window",
      label: "Data",
      start: 86,
      length: 30,
    },
    { id: "live", lane: "Window", label: "Live", start: 100, length: 12 },
  ];
  CARDS.forEach((label, i) => {
    elements.push({
      id: `card:${i}`,
      lane: "Cards",
      label,
      start: EJECT[i],
      length: (EJECT[i + 1] ?? EJECT[i] + 4) - EJECT[i],
      follows: i > 0 ? `card:${i - 1}` : "flip",
      beats: { pop: 5, drift: 8 },
    });
  });
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
