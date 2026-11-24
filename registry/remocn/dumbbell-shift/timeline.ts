import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera settling, each row's guide and before-dot entering, each row's
// dot sliding from before to after, the before/after notes fading, the rows
// sorting by gain, and the winner's figure growing into the hero. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type DumbbellShiftElementId =
  | "push"
  | `row:${number}`
  | `slide:${number}`
  | "notes-out"
  | "sort"
  | "hero";

interface Row {
  label: string;
  before: number;
  after: number;
}

export interface DumbbellShiftTimingProps {
  rows?: Row[];
  stagger?: number;
  slideDuration?: number;
}

export const DEFAULT_ROWS: Row[] = [
  { label: "Launch videos", before: 2, after: 9 },
  { label: "Changelogs", before: 4, after: 7 },
  { label: "Social clips", before: 3, after: 19 },
  { label: "Tutorials", before: 5, after: 11 },
  { label: "Onboarding", before: 1, after: 6 },
  { label: "Ads", before: 6, after: 8 },
];

/** The rows the chart shows: the first seven. */
export function shownRows<R extends Row>(rows: R[]) {
  return rows.slice(0, 7);
}

const ENTER_STAGGER = 3;
const SLIDE_START = 18;
export const SLIDE_STAGGER = 5;
export const SLIDE_DUR = 26;
const SORT = [78, 108] as const;
const HERO = 110;

// `row:<i>` draws row `i`'s guide and before-dot; a chain. `slide:<i>`
// slides its dot to the after value over its length, also a chain; its
// delta rises from `deltaIn` to `deltaEnd`, counted from the slide's END.
// `notes-out` fades the before/after notes ahead of `sort`, which follows
// it. `hero` dims the other rows over `dim`, grows the winner's figure over
// `grow` and raises its caption from `captionAt` to `captionEnd`.
export const dumbbellShiftTimeline = defineTimeline<
  DumbbellShiftElementId,
  DumbbellShiftTimingProps
>(
  ({
    rows = DEFAULT_ROWS,
    stagger = SLIDE_STAGGER,
    slideDuration = SLIDE_DUR,
  }) => {
    const list = shownRows(rows);
    const notesAt = SORT[0] - 8;
    const lastSlide = SLIDE_START + (list.length - 1) * stagger;
    const elements: TimelineElement<DumbbellShiftElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "Push",
        start: 0,
        length: HERO + 40,
      },
      ...list.map(
        (row, i): TimelineElement<DumbbellShiftElementId> => ({
          id: `row:${i}`,
          lane: "Rows",
          label: row.label,
          start: 2 + i * ENTER_STAGGER,
          length: 18,
          follows: i > 0 ? `row:${i - 1}` : undefined,
        }),
      ),
      ...list.map(
        (row, i): TimelineElement<DumbbellShiftElementId> => ({
          id: `slide:${i}`,
          lane: "Dots",
          label: row.label,
          start: SLIDE_START + i * stagger,
          length: slideDuration,
          follows: i > 0 ? `slide:${i - 1}` : undefined,
          beats: { deltaIn: -8, deltaEnd: 8 },
        }),
      ),
      {
        id: "notes-out",
        lane: "Notes",
        label: "Notes out",
        start: notesAt,
        length: 10,
        follows:
          list.length > 0 && lastSlide <= notesAt
            ? `slide:${list.length - 1}`
            : undefined,
      },
      {
        id: "sort",
        lane: "Rows",
        label: "Sort",
        start: SORT[0],
        length: SORT[1] - SORT[0],
        follows: "notes-out",
      },
      {
        id: "hero",
        lane: "Hero",
        label: "Hero",
        start: HERO,
        length: 30,
        follows: "sort",
        beats: { dim: 16, grow: 22, captionAt: 12, captionEnd: 30 },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
