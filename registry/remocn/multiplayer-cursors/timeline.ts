import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A shared whiteboard: the window rising in, then four collaborators'
// cursors joining and working at once. One drags a sticky note out of the
// toolbar and types on it, one marquee-selects a card, one drags a shape
// across the board, and one drops a pin and types a comment, all under a
// slow camera push. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type MultiplayerCursorsElementId =
  | "app"
  | "header"
  | "sticky"
  | "select"
  | "camera"
  | "drag"
  | "comment"
  | "type";

/** The scene's timing does not depend on its props. */
export type MultiplayerCursorsTimingProps = object;

/** Each collaborator's cursor track, by the collaborator's index. */
export const CURSOR_TRACKS = ["sticky", "select", "drag", "comment"] as const;

/** Beats a cursor track shares: its keyframes and its presses. */
const track = (keys: number[], presses: [number, number][]) => {
  const at = keys[0];
  const beats: Record<string, number> = { fadeIn: 6, join: 10 };
  keys.forEach((k, j) => {
    beats[`k${j}`] = k - at;
  });
  presses.forEach(([down, up], n) => {
    beats[`down${n}`] = down - at;
    beats[`up${n}`] = up - at;
  });
  return { start: at, length: keys[keys.length - 1] - at, beats };
};

// `app` rises the window in on a spring, fading over its length. `header`
// fades the title in. `camera` pushes in over its length. Each cursor track
// (`sticky`, `select`, `drag`, `comment`) starts as its cursor fades in over
// `fadeIn`; its avatar joins at `join`, the cursor glides to keyframe `k<j>`
// and presses from `down<n>` to `up<n>`. `sticky` lights the sticky tool
// from `tool` to `toolOn`, off from `toolOff` to `toolGone`, carries a ghost
// note from `ghost` and lands it at `land`. `select` draws the marquee from
// its press until `marqueeEnd` and snaps to the card on release. `drag`
// lifts the shape while pressed, until `lift`. `comment` drops the pin at
// `pin`, opens the bubble from `bubble` to `bubbleIn` and types the comment
// from `typeAt` to `typeEnd`. `type` types the sticky note's text over its
// length, the caret blinking from `caret` to `caretOff`.
export const multiplayerCursorsTimeline = defineTimeline<
  MultiplayerCursorsElementId,
  MultiplayerCursorsTimingProps
>((): TimelineElement<MultiplayerCursorsElementId>[] => {
  const sticky = track(
    [6, 30, 38, 62, 70, 88, 188, 212],
    [
      [32, 35],
      [64, 67],
    ],
  );
  const select = track([20, 48, 52, 80, 112, 136, 192, 216], [[52, 80]]);
  const drag = track([44, 72, 78, 110, 150, 176], [[78, 110]]);
  const comment = track([78, 106, 160, 184, 210, 232], [[109, 112]]);
  return [
    { id: "app", lane: "Board", label: "Window", start: 0, length: 12 },
    { id: "header", lane: "Board", label: "Header", start: 4, length: 16 },
    {
      id: "sticky",
      lane: "Cursor 1",
      label: "Sticky note",
      ...sticky,
      beats: {
        ...sticky.beats,
        tool: 31 - 6,
        toolOn: 34 - 6,
        toolOff: 60 - 6,
        toolGone: 66 - 6,
        ghost: 36 - 6,
        land: 65 - 6,
      },
    },
    {
      id: "select",
      lane: "Cursor 2",
      label: "Select",
      ...select,
      beats: { ...select.beats, marqueeEnd: 82 - 20 },
    },
    { id: "camera", lane: "Camera", label: "Push", start: 20, length: 240 },
    {
      id: "drag",
      lane: "Cursor 3",
      label: "Drag shape",
      ...drag,
      beats: { ...drag.beats, lift: 112 - 44 },
    },
    {
      id: "comment",
      lane: "Cursor 4",
      label: "Comment",
      ...comment,
      beats: {
        ...comment.beats,
        pin: 111 - 78,
        bubble: 118 - 78,
        bubbleIn: 126 - 78,
        typeAt: 124 - 78,
        typeEnd: 152 - 78,
      },
    },
    {
      id: "type",
      lane: "Note",
      label: "Type note",
      start: 80,
      length: 44,
      beats: { caret: -8, caretOff: 56 },
    },
  ];
});
