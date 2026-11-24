import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The cursor enters, approaches the button that sits past the frame's right
// edge, and pulls it into view in three tugs; the button springs free and
// wobbles, the cursor lets go and leaves. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type CursorGravityElementId =
  | "enter"
  | "approach"
  | `tug:${number}`
  | "release"
  | "wobble"
  | "letgo"
  | "leave";

/** The scene's timing does not depend on its props. */
export type CursorGravityTimingProps = object;

// A tug pulls hard until `grab`, holds under load until `hold` and recoils to
// its end; the cursor's effort peaks at `peak`, holds until `ease` and
// relaxes by `relax`. The first tug also hooks the tether (`tetherAt` to
// `tether`). The release springs the back of the button free and settles from
// `settleAt`; the wobble fades from `fadeAt`. The cursor stays attached until
// `detach` into the let-go.
export const cursorGravityTimeline = defineTimeline<
  CursorGravityElementId,
  CursorGravityTimingProps
>((): TimelineElement<CursorGravityElementId>[] => [
  { id: "enter", lane: "Cursor", label: "enter", start: 10, length: 29 },
  {
    id: "approach",
    lane: "Cursor",
    label: "approach",
    start: 39,
    length: 9,
    follows: "enter",
  },
  {
    id: "tug:0",
    lane: "Cursor",
    label: "first tug",
    start: 48,
    length: 22,
    follows: "approach",
    beats: {
      grab: 11,
      hold: 16,
      peak: 10,
      ease: 16,
      relax: 22,
      tetherAt: -2,
      tether: 1,
    },
  },
  {
    id: "tug:1",
    lane: "Cursor",
    label: "second tug",
    start: 70,
    length: 24,
    follows: "tug:0",
    beats: { grab: 13, hold: 17, peak: 11, ease: 17, relax: 24 },
  },
  {
    id: "tug:2",
    lane: "Cursor",
    label: "last pull",
    start: 94,
    length: 18,
    follows: "tug:1",
    beats: { peak: 6, ease: 10, relax: 24 },
  },
  {
    id: "release",
    lane: "Button",
    label: "spring free",
    start: 94,
    length: 38,
    follows: "tug:1",
    beats: { settleAt: 28 },
  },
  {
    id: "wobble",
    lane: "Button",
    label: "wobble",
    start: 112,
    length: 28,
    follows: "tug:2",
    beats: { fadeAt: 20 },
  },
  {
    id: "letgo",
    lane: "Cursor",
    label: "let go",
    start: 115,
    length: 7,
    follows: "tug:2",
    beats: { detach: 6 },
  },
  {
    id: "leave",
    lane: "Cursor",
    label: "leave",
    start: 127,
    length: 24,
    follows: "letgo",
  },
]);
