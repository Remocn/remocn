import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dot grid rippling out and the subject fading up, the four corner
// brackets flying in from the frame's edges and snapping tight round it,
// the tag and the size readout riding their corners, and the focus: the
// grid dims while the subject lights up in the gradient. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type BracketFocusElementId =
  | "grid"
  | "subject"
  | `corner:${number}`
  | "tag"
  | "focus"
  | "readout";

export interface BracketFocusTimingProps {
  fly?: number;
}

export const CORNERS = [
  { sx: -1, sy: -1, delay: 0 },
  { sx: 1, sy: -1, delay: 2 },
  { sx: 1, sy: 1, delay: 3 },
  { sx: -1, sy: 1, delay: 5 },
] as const;

const CORNER_LABELS = ["top left", "top right", "bottom right", "bottom left"];
const FLY_AT = 10;
export const FLY_LEN = 22;
/** The grid fades up over `GRID`; a dot lights `RIPPLE` per unit of distance, over `WAVE`. */
const GRID = 8;
const RIPPLE = 18;
const WAVE = 10;
const SUBJECT = 16;
/** The tag opens `TAG_AT` after the snap; its text slides in from `textAt` over `text`. */
const TAG_AT = 6;
const TAG = 14;
const TAG_TEXT_AT = 4;
const TAG_TEXT = 12;
/** The readout fades in `READ_AT` after the tag. */
const READ_AT = 8;
const READ = 14;
/** The focus dims the grid from `DIM_AT` after the snap; the subject lights from `liftAt` over `lift`. */
const DIM_AT = 8;
const DIM = 22;
const LIFT_AT = -2;
const LIFT = 20;
/** The slow push in runs from the start until `push` into the focus. */
const PUSH = 50;

// `corner:<i>` flies in over its length and snaps at its end (top left, top
// right, bottom right, bottom left); the corners form a chain. `tag` and
// `focus` follow the first corner's snap, `readout` follows the tag.
export const bracketFocusTimeline = defineTimeline<
  BracketFocusElementId,
  BracketFocusTimingProps
>(({ fly = FLY_LEN }) => {
  const snapAt = FLY_AT + fly;
  const tagAt = snapAt + TAG_AT;
  const dimAt = snapAt + DIM_AT;
  const elements: TimelineElement<BracketFocusElementId>[] = [
    {
      id: "grid",
      lane: "Grid",
      label: "grid",
      start: 0,
      length: GRID,
      beats: { ripple: RIPPLE, wave: WAVE },
    },
    {
      id: "subject",
      lane: "Subject",
      label: "subject",
      start: 0,
      length: SUBJECT,
    },
    ...CORNERS.map(
      (c, i): TimelineElement<BracketFocusElementId> => ({
        id: `corner:${i}`,
        lane: "Brackets",
        label: CORNER_LABELS[i],
        start: FLY_AT + c.delay,
        length: fly,
        follows: i > 0 ? `corner:${i - 1}` : undefined,
      }),
    ),
    {
      id: "tag",
      lane: "Labels",
      label: "tag",
      start: tagAt,
      length: TAG,
      follows: "corner:0",
      beats: { textAt: TAG_TEXT_AT, text: TAG_TEXT },
    },
    {
      id: "focus",
      lane: "Subject",
      label: "focus",
      start: dimAt,
      length: DIM,
      follows: "corner:0",
      beats: { liftAt: LIFT_AT, lift: LIFT, push: PUSH },
    },
    {
      id: "readout",
      lane: "Labels",
      label: "readout",
      start: tagAt + READ_AT,
      length: READ,
      follows: "tag",
    },
  ];
  return elements;
});
