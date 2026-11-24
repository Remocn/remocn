import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Files dropped into an upload modal: the app and the modal come in, the
// cursor carries the files over the drop zone and lets go, each file's row
// slides in and its upload runs, the upload button enables and is clicked,
// the modal closes onto the file table and a toast confirms. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type FileDropzoneElementId =
  | "app"
  | "modal"
  | "camera"
  | "cursor"
  | "hover"
  | "drop"
  | `row:${number}`
  | `upload:${number}`
  | "enable"
  | "click"
  | "close"
  | "table"
  | "toast";

export interface FileDropzoneTimingProps {
  files?: { name: string; size: number }[];
}

export const DEFAULT_FILES: { name: string; size: number }[] = [
  { name: "Q3-board-deck.pdf", size: 4_200_000 },
  { name: "hero-shot@2x.png", size: 1_800_000 },
  { name: "customers-export.csv", size: 640_000 },
];

const BEAT = {
  app: 0,
  modal: 6,
  cursor: 10,
  hover: 32,
  drop: 46,
};

export const fileDropzoneTimeline = defineTimeline<
  FileDropzoneElementId,
  FileDropzoneTimingProps
>(({ files = DEFAULT_FILES }) => {
  const list = files.slice(0, 3);
  const rowAt = list.map((_, i) => BEAT.drop + 4 + i * 4);
  // A bigger file uploads longer, 24 to 50 frames.
  const dur = list.map((f) =>
    Math.round(Math.min(50, Math.max(24, 20 + (f.size / 1_000_000) * 7))),
  );
  const startAt = rowAt.map((at) => at + 4);
  const doneAt = list.map((_, i) => startAt[i] + dur[i]);
  const allDone = Math.max(...doneAt, BEAT.drop + 10);
  const lastDone = doneAt.indexOf(allDone);
  const ENABLE = allDone + 2;
  const CLICK = ENABLE + 10;
  const CLOSE = CLICK + 4;
  const TABLE = CLOSE + 4;
  const TOAST = CLOSE + 12;

  const elements: TimelineElement<FileDropzoneElementId>[] = [
    { id: "app", lane: "App", label: "app", start: BEAT.app, length: 10 },
    {
      id: "modal",
      lane: "Modal",
      label: "upload modal",
      start: BEAT.modal,
      length: 12,
      beats: { fade: 8, dim: 12 },
    },
    { id: "camera", lane: "Camera", label: "push in", start: 8, length: 54 },
    {
      id: "cursor",
      lane: "Cursor",
      label: "cursor brings the files",
      start: BEAT.cursor,
      length: BEAT.hover - BEAT.cursor,
      // The cursor fades in over `fade`; its count badge pops at `badge` and
      // each file card `stagger` after the last.
      beats: { fade: 4, badge: 4, stagger: 2 },
    },
    {
      id: "hover",
      lane: "Cursor",
      label: "over the drop zone",
      start: BEAT.hover,
      length: BEAT.drop - BEAT.hover,
      follows: "cursor",
    },
    {
      id: "drop",
      lane: "Cursor",
      label: "drop",
      start: BEAT.drop,
      length: 4,
      follows: "hover",
      // The zone shuts at `shut`, the cursor moves aside at `aside`, the badge
      // fades over `badgeOut`, and each card flies to its row `stagger` after
      // the last. The cards hang `held` behind the cursor until the drop.
      beats: { shut: 2, aside: 6, badgeOut: 5, stagger: 3, held: -2 },
    },
  ];
  list.forEach((f, i) => {
    elements.push(
      {
        id: `row:${i}`,
        lane: "Rows",
        label: f.name,
        start: rowAt[i],
        length: startAt[i] - rowAt[i],
        follows: i > 0 ? `row:${i - 1}` : "drop",
      },
      {
        id: `upload:${i}`,
        lane: `Upload ${i + 1}`,
        label: `${f.name} uploads`,
        start: startAt[i],
        length: dur[i],
        follows: `row:${i}`,
        beats: { tick: 8 },
      },
    );
  });
  elements.push(
    {
      id: "enable",
      lane: "Footer",
      label: "upload enabled",
      start: ENABLE,
      length: CLICK - ENABLE,
      follows: lastDone >= 0 ? `upload:${lastDone}` : "drop",
      // The button lights over `fade`; the cursor sets off for it at `reach`.
      beats: { fade: 6, reach: -14 },
    },
    {
      id: "click",
      lane: "Footer",
      label: "click upload",
      start: CLICK,
      length: CLOSE - CLICK,
      follows: "enable",
      beats: { down: -2, up: 3, leave: 12 },
    },
    {
      id: "close",
      lane: "Modal",
      label: "modal closes",
      start: CLOSE,
      length: TABLE - CLOSE,
      follows: "click",
      beats: { out: 8, dim: 12, camera: -2, cameraOut: 26 },
    },
    {
      id: "table",
      lane: "Table",
      label: "files in the table",
      start: TABLE,
      length: 64,
      follows: "close",
      // A fresh row opens every `stagger`; their tint fades from `tint` over
      // `tintOut`.
      beats: { stagger: 4, tint: 24, tintOut: 40 },
    },
    {
      id: "toast",
      lane: "Toast",
      label: "toast",
      start: TOAST,
      length: 6,
      follows: "close",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
