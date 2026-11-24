import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The word and viewfinder fading in, the box snapping tight while the weight
// and colour change and the bracket arms close, then the handles and the size
// badge popping in. Frames on the 30 fps scene timeline, after `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type SelectionSnapElementId =
  | "intro"
  | "snap"
  | "weight"
  | "edges"
  | "tint"
  | "badge"
  | "count"
  | `handle:${number}`;

/** Corners first, then edge midpoints, as fractions of the box. */
export const selectionSnapHandles = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
] as const;

// Every element is fixed: the schedule doesn't read any prop.
export const selectionSnapTimeline = defineTimeline<
  SelectionSnapElementId,
  object
>(() => {
  const elements: TimelineElement<SelectionSnapElementId>[] = [
    { id: "intro", lane: "Intro", label: "fade in", start: 0, length: 8 },
    { id: "snap", lane: "Snap", label: "snap tight", start: 14, length: 14 },
    { id: "weight", lane: "Weight", label: "weight", start: 14, length: 16 },
    { id: "edges", lane: "Edges", label: "close edges", start: 16, length: 10 },
    { id: "tint", lane: "Colour", label: "colour", start: 18, length: 12 },
    { id: "badge", lane: "Badge", label: "badge", start: 24, length: 8 },
    { id: "count", lane: "Readout", label: "count", start: 24, length: 14 },
    ...selectionSnapHandles.map(
      (_, i): TimelineElement<SelectionSnapElementId> => ({
        id: `handle:${i}`,
        lane: "Handles",
        label: `handle ${i + 1}`,
        start: 24 + i,
        length: 5,
        follows: i > 0 ? `handle:${i - 1}` : undefined,
      }),
    ),
  ];
  return elements;
});
