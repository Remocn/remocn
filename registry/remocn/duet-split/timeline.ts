import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The split opens, the labels rise, each row lands on both sides (the before
// side trickling in letter by letter), then the before slab is pushed off,
// the after rows glide to the centre and the mark rises. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type DuetSplitElementId =
  | "camera"
  | "open"
  | "labels"
  | `row:${number}`
  | "push"
  | "logo";

export interface DuetRow {
  before: string;
  after: string;
}

export interface DuetSplitTimingProps {
  rows?: DuetRow[];
  stagger?: number;
  hold?: number;
}

export const DEFAULT_ROWS: DuetRow[] = [
  { before: "3 weeks", after: "1 day" },
  { before: "an agency", after: "you" },
  { before: "$12K", after: "$0" },
];

const LABEL_AT = 6;
const ROW_AT = 18;
const ROW_GAP = 16;
const TRICKLE = 3;
const GLYPH_LEN = 14;
const PUSH_DELAY = 24;
const PUSH_LEN = 16;

// The camera drifts in over 160 frames on its own lane. `open` springs the
// slab from `slab` frames (it is already moving on frame 0) and the after
// side from `after`. The labels rise over 12 frames. A row runs until the
// next one; its before letters start `trickle` apart and take `glyph` each,
// its after word fades in over `fade`, and the camera kicks `kick` frames in.
// Each row follows the one before. The push slides the slab off and fades
// the after label over `label`; the mark rises `fade` frames after it.
export const duetSplitTimeline = defineTimeline<
  DuetSplitElementId,
  DuetSplitTimingProps
>(({ rows = DEFAULT_ROWS, stagger = ROW_GAP, hold = PUSH_DELAY }) => {
  const lastRowAt = ROW_AT + (rows.length - 1) * stagger;
  const pushAt = lastRowAt + hold;
  const logoAt = pushAt + PUSH_LEN - 4;
  const elements: TimelineElement<DuetSplitElementId>[] = [
    { id: "camera", lane: "Camera", label: "drift", start: 0, length: 160 },
    {
      id: "open",
      lane: "Split",
      label: "split opens",
      start: 0,
      length: 24,
      beats: { slab: -5, after: 2 },
    },
    {
      id: "labels",
      lane: "Labels",
      label: "labels",
      start: LABEL_AT,
      length: 12,
    },
    ...rows.map(
      (row, i): TimelineElement<DuetSplitElementId> => ({
        id: `row:${i}`,
        lane: "Rows",
        label: `${row.before} → ${row.after}`,
        start: ROW_AT + i * stagger,
        length: i === rows.length - 1 ? hold : stagger,
        follows: i > 0 ? `row:${i - 1}` : undefined,
        beats: { trickle: TRICKLE, glyph: GLYPH_LEN, fade: 3, kick: 3 },
      }),
    ),
    {
      id: "push",
      lane: "Split",
      label: "push",
      start: pushAt,
      length: PUSH_LEN,
      follows: rows.length > 0 ? `row:${rows.length - 1}` : undefined,
      beats: { label: 8 },
    },
    {
      id: "logo",
      lane: "Logo",
      label: "mark",
      start: logoAt,
      length: 20,
      follows: "push",
      beats: { fade: 6 },
    },
  ];
  return elements;
});
