import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The cursor gliding in, dragging the text frame open, grabbing the corner
// and resizing the frame to two lines, letting go, then the frame clearing
// and the text gliding to the optical centre. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type CursorFrameElementId =
  | "enter"
  | "drag"
  | "resize"
  | "release"
  | "recentre"
  | "clear";

/** The scene's timing does not depend on its props. */
export type CursorFrameTimingProps = object;

// `drag` opens the frame from the press (`press` before it) to the corner's
// stop; each word fades in `wordLead` before the frame passes its centre,
// over `word`. `resize` swaps to the resize arrows at `grab` and drags the
// corner in; the words keep settling for `settle` after it, and a word that
// wraps slides in `wrapDelay` after its wrap, over `wrap`. `release` lets go
// and drifts the cursor off. `clear` and `recentre` follow the resize.
export const cursorFrameTimeline = defineTimeline<
  CursorFrameElementId,
  CursorFrameTimingProps
>((): TimelineElement<CursorFrameElementId>[] => [
  {
    id: "enter",
    lane: "Cursor",
    label: "cursor in",
    start: 0,
    length: 24,
    beats: { fade: 8 },
  },
  {
    id: "drag",
    lane: "Frame",
    label: "drag open",
    start: 28,
    length: 42,
    follows: "enter",
    beats: {
      press: -3,
      click: 3,
      rise: 14,
      chrome: 4,
      handles: 2,
      handlesIn: 10,
      wordLead: -4,
      word: 12,
    },
  },
  {
    id: "resize",
    lane: "Frame",
    label: "resize",
    start: 86,
    length: 48,
    follows: "drag",
    beats: {
      grab: -6,
      icon: 3,
      press: -3,
      lift: 4,
      click: 3,
      settle: 60,
      wrapDelay: 4,
      wrap: 11,
    },
  },
  {
    id: "release",
    lane: "Cursor",
    label: "let go",
    start: 140,
    length: 34,
    follows: "resize",
    beats: { icon: 3, drift: 6, fade: 14 },
  },
  {
    id: "recentre",
    lane: "Text",
    label: "recentre",
    start: 148,
    length: 36,
    follows: "resize",
  },
  {
    id: "clear",
    lane: "Frame",
    label: "clear",
    start: 150,
    length: 14,
    follows: "resize",
  },
]);
