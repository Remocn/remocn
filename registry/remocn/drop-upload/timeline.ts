import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The drop zone and its title rise in, a file flies over the zone and
// hovers, drops, the zone collapses into an upload row, the file's details
// and the recent uploads come in, the progress bar fills and the row turns
// to done, while the camera eases in and pushes. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type DropUploadElementId =
  | "camera"
  | "zone"
  | "title"
  | "fly"
  | "hover"
  | "drop"
  | "collapse"
  | "info"
  | "progress"
  | "done";

/** The scene's timing does not depend on its props. */
export type DropUploadTimingProps = object;

const B = {
  zone: -8,
  title: -2,
  fly: 6,
  hover: 30,
  drop: 54,
  collapse: 60,
  info: 72,
  progress: 78,
  done: 114,
  end: 162,
};

// The camera eases in from before frame 0 and pushes slowly from `pushAt`
// to the end. The hover lights the zone from `highlightAt` and sways the
// file from `swayAt`; the drop lands over `fall` and punches the zone at
// `hitAt`. The collapse fills the row in from `solidAt` and sends the file
// to the row's icon at `toRowAt`; the recent uploads follow the info,
// `stagger` apart.
export const dropUploadTimeline = defineTimeline<
  DropUploadElementId,
  DropUploadTimingProps
>((): TimelineElement<DropUploadElementId>[] => [
  {
    id: "camera",
    lane: "Camera",
    label: "camera",
    start: -8,
    length: B.end + 8,
    beats: { pushAt: 8, push: B.end },
  },
  {
    id: "zone",
    lane: "Zone",
    label: "drop zone",
    start: B.zone,
    length: B.fly - B.zone,
    beats: { fadeAt: 2, fade: 8 },
  },
  {
    id: "title",
    lane: "Title",
    label: "title",
    start: B.title,
    length: 15,
  },
  {
    id: "fly",
    lane: "File",
    label: "fly in",
    start: B.fly,
    length: 26,
    beats: { fade: 4 },
  },
  {
    id: "hover",
    lane: "File",
    label: "hover",
    start: B.hover,
    length: B.drop - B.hover,
    follows: "fly",
    beats: { highlightAt: -8, highlight: 12, swayAt: -4, sway: 10 },
  },
  {
    id: "drop",
    lane: "File",
    label: "drop",
    start: B.drop,
    length: B.collapse - B.drop,
    follows: "hover",
    beats: { fall: 8, hitAt: 6, punchOutAt: 14, punchOut: 6 },
  },
  {
    id: "collapse",
    lane: "Zone",
    label: "collapse",
    start: B.collapse,
    length: B.info - B.collapse,
    follows: "drop",
    beats: {
      highlightOut: 8,
      solidAt: -2,
      solid: 14,
      contentAt: -2,
      contentOut: 8,
      toRowAt: 2,
    },
  },
  {
    id: "info",
    lane: "Row",
    label: "file info",
    start: B.info,
    length: 12,
    follows: "collapse",
    beats: { historyAt: 2, stagger: 5, history: 8 },
  },
  {
    id: "progress",
    lane: "Row",
    label: "progress",
    start: B.progress,
    length: B.done - 4 - B.progress,
    follows: "info",
  },
  {
    id: "done",
    lane: "Row",
    label: "done",
    start: B.done,
    length: 6,
    follows: "progress",
    beats: { checkAt: 2, check: 8 },
  },
]);
