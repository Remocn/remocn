import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A video watch page: the page rises with its chapters, title, actions,
// description and transcript, the player's controls tuck away, the cursor
// scrubs over the progress bar, subscribes, then likes while the counts roll
// up and the camera leans in. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type VideoWatchPageElementId =
  | "page"
  | "chapters"
  | "title"
  | "cursor"
  | "actions"
  | "description"
  | "controls"
  | "transcript"
  | "hover"
  | "subscribe"
  | "like"
  | "camera";

/** The scene's timing does not depend on its props. */
export type VideoWatchPageTimingProps = object;

const HOVER_IN = 30;
const HOVER_OUT = 72;
const SUB_CLICK = 92;
const LIKE_CLICK = 120;
const END = 210;

export const videoWatchPageTimeline = defineTimeline<
  VideoWatchPageElementId,
  VideoWatchPageTimingProps
>((): TimelineElement<VideoWatchPageElementId>[] => [
  { id: "page", lane: "Page", label: "page", start: 0, length: 6 },
  {
    id: "chapters",
    lane: "Side",
    label: "chapters",
    start: 6,
    length: 12,
    // The rows rise from `rows`, each `stagger` after the one above.
    beats: { rows: 2, stagger: 2 },
  },
  { id: "title", lane: "Details", label: "title", start: 8, length: 4 },
  { id: "cursor", lane: "Cursor", label: "cursor", start: 8, length: 8 },
  {
    id: "actions",
    lane: "Details",
    label: "channel and actions",
    start: 12,
    length: 4,
    follows: "title",
  },
  {
    id: "description",
    lane: "Details",
    label: "description",
    start: 16,
    length: 14,
    follows: "actions",
  },
  {
    id: "controls",
    lane: "Player",
    label: "controls tuck away",
    start: 18,
    length: 10,
  },
  {
    id: "transcript",
    lane: "Side",
    label: "transcript",
    start: 18,
    length: 12,
    follows: "chapters",
    beats: { lines: 2 },
  },
  {
    id: "hover",
    lane: "Player",
    label: "scrub the progress bar",
    start: HOVER_IN,
    length: HOVER_OUT - HOVER_IN,
    // The controls come up from `lead` to `lit` and fade over `fade` after
    // the end; the cursor leaves the bar at `leave`.
    beats: { lead: -6, lit: 4, leave: HOVER_OUT - 8 - HOVER_IN, fade: 8 },
  },
  {
    id: "subscribe",
    lane: "Actions",
    label: "subscribe",
    start: SUB_CLICK,
    length: LIKE_CLICK - SUB_CLICK,
    follows: "hover",
    beats: { reach: -2, leave: 8, pop: 1, bell: 4, count: 20, release: 5 },
  },
  {
    id: "like",
    lane: "Actions",
    label: "like",
    start: LIKE_CLICK,
    length: END - LIKE_CLICK,
    follows: "subscribe",
    beats: {
      reach: -2,
      leave: 24,
      pop: 1,
      roll: 2,
      rollEnd: 42,
      views: 6,
      viewsEnd: 70,
      release: 5,
    },
  },
  {
    id: "camera",
    lane: "Camera",
    label: "lean in",
    start: LIKE_CLICK,
    length: END - LIKE_CLICK,
  },
]);
