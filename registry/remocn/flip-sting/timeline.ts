import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera pulls out of the R to the whole logo while a flip-book of flat
// frames riffles inside the letters, slowing page by page until the last
// page lands and the logo fills with the gradient. The line rises in under
// the logo during a slow push. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type FlipStingElementId =
  | "pull"
  | `page:${number}`
  | "fill"
  | "line"
  | "push";

export interface FlipStingTimingProps {
  pull?: number;
}

const PULL_END = 68;
const LINE_AT = 74;
/** Frames the demo needs: the flip plus a long poster hold. */
export const FLIP_LENGTH = 130;

/** Page lengths: a fast riffle that slows into the final fill. */
const PAGES = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 8,
];
const SETTLE_AT = PAGES.reduce((a, b) => a + b, 0);

// `pull` takes the camera out of the R over its length; `push` then pushes
// in slowly to the end. `page:<i>` shows page `i` of the flip-book for its
// length (a chain). `fill` lands the gradient after the last page and lets
// it drift to the end. `line` raises the line in under the logo.
export const flipStingTimeline = defineTimeline<
  FlipStingElementId,
  FlipStingTimingProps
>(({ pull = PULL_END }) => {
  const elements: TimelineElement<FlipStingElementId>[] = [
    { id: "pull", lane: "Camera", label: "Pull out", start: 0, length: pull },
  ];
  let acc = 0;
  PAGES.forEach((len, i) => {
    elements.push({
      id: `page:${i}`,
      lane: "Flip-book",
      label: `Page ${i + 1}`,
      start: acc,
      length: len,
      follows: i > 0 ? `page:${i - 1}` : undefined,
    });
    acc += len;
  });
  elements.push(
    {
      id: "fill",
      lane: "Flip-book",
      label: "Fill",
      start: SETTLE_AT,
      length: FLIP_LENGTH - SETTLE_AT,
      follows: `page:${PAGES.length - 1}`,
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: pull,
      length: FLIP_LENGTH - pull,
      follows: "pull",
    },
    { id: "line", lane: "Line", label: "Line", start: LINE_AT, length: 16 },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
