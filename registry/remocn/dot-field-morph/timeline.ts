import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A calm field of dots drifts, then swirls into each shape in turn, holds it
// under a sweeping highlight and its caption, and moves on; the last shape
// takes a longer morph and holds. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type DotFieldMorphElementId = "camera" | "field" | `shape:${number}`;

export interface DotFieldMorphTimingProps {
  shapes?: readonly unknown[];
  labels?: string[];
  hold?: number;
  morph?: number;
}

export const DEFAULT_LABELS = ["Animations", "Transitions", "Captions", ""];
/** The component's built-in shapes: one per default label. */
const DEFAULT_SHAPE_COUNT = DEFAULT_LABELS.length;

export const FIELD = 14;
export const MORPH = 30;
export const HOLD = 22;
export const LAST_MORPH = 36;

export function morphStarts(
  shapeCount: number,
  hold = HOLD,
  morph = MORPH,
): number[] {
  const starts: number[] = [];
  let t = FIELD;
  for (let i = 0; i < shapeCount; i++) {
    starts.push(t);
    t += (i === shapeCount - 1 ? LAST_MORPH : morph) + hold;
  }
  return starts;
}

// The camera pushes in over the whole shot, on its own lane. The field
// drifts until the first morph. A shape runs from the start of its morph to
// the next shape: the dots fly in over `morph`, the highlight sweeps over
// `hold`, and the caption before it fades over `release` as it begins. Each
// shape follows the one before it.
export const dotFieldMorphTimeline = defineTimeline<
  DotFieldMorphElementId,
  DotFieldMorphTimingProps
>(({ shapes, labels = DEFAULT_LABELS, hold = HOLD, morph = MORPH }) => {
  const count = shapes?.length ? shapes.length : DEFAULT_SHAPE_COUNT;
  const starts = morphStarts(count, hold, morph);
  const end = starts[count - 1] + LAST_MORPH;
  const elements: TimelineElement<DotFieldMorphElementId>[] = [
    {
      id: "camera",
      lane: "Camera",
      label: "push in",
      start: 0,
      length: end + 40,
    },
    { id: "field", lane: "Shapes", label: "field", start: 0, length: FIELD },
  ];
  starts.forEach((start, i) => {
    const winLen = i === count - 1 ? LAST_MORPH : morph;
    elements.push({
      id: `shape:${i}`,
      lane: "Shapes",
      label: labels[i] || `shape ${i + 1}`,
      start,
      length: winLen + hold,
      follows: i > 0 ? `shape:${i - 1}` : "field",
      beats: { morph: winLen, hold, release: 8 },
    });
  });
  return elements;
});
