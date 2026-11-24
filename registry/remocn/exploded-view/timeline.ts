import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type ExplodedViewElementId =
  | `slab:${number}`
  | `label:${number}`
  | "close";

export interface ExplodedViewTimingProps {
  layers?: number;
  labels?: string[];
}

export const EXPLODED_LAYERS = 4;
export const EXPLODED_LABELS = ["Interface", "Engine", "Storage", "Hardware"];

const OPEN = 3;
/** Frames between two slabs lifting off, top slab first. */
const SLAB_STAGGER = 1.5;
/** Frames the open spring takes to settle. */
const SLAB_OPEN = 20;
const LABEL_AT = 14;
const LABEL_STAGGER = 2.5;
/** Frames the leader line takes to draw. */
const LABEL_DRAW = 10;
const CLOSE = 38;

/** Slab count the stack draws, 2 to 6. */
export function explodedLayerCount(layers: number) {
  return Math.round(Math.min(6, Math.max(2, layers)));
}

// The slabs lift apart top first, each label draws its leader line and
// slides in, then the stack snaps shut with a knock. Indices count from the
// top slab.
export const explodedViewTimeline = defineTimeline<
  ExplodedViewElementId,
  ExplodedViewTimingProps
>(({ layers = EXPLODED_LAYERS, labels = EXPLODED_LABELS }) => {
  const n = explodedLayerCount(layers);
  const elements: TimelineElement<ExplodedViewElementId>[] = [];
  for (let fromTop = 0; fromTop < n; fromTop++) {
    elements.push({
      id: `slab:${fromTop}`,
      lane: "Slabs",
      label: `Slab ${fromTop + 1}`,
      start: OPEN + fromTop * SLAB_STAGGER,
      length: SLAB_OPEN,
      follows: fromTop > 0 ? `slab:${fromTop - 1}` : undefined,
    });
  }
  let last: ExplodedViewElementId | undefined;
  for (let fromTop = 0; fromTop < n; fromTop++) {
    const label = labels[fromTop];
    if (!label) continue;
    const id: ExplodedViewElementId = `label:${fromTop}`;
    elements.push({
      id,
      lane: "Labels",
      label,
      start: LABEL_AT + fromTop * LABEL_STAGGER,
      length: LABEL_DRAW,
      follows: last,
      // The text slides in 5 frames into the line and takes 8.
      beats: { show: 5, slide: 8 },
    });
    last = id;
  }
  elements.push({
    id: "close",
    lane: "Stack",
    label: "Close",
    start: CLOSE,
    length: 12,
    follows: last,
    // The labels fade out over the 5 frames before the close; the knock
    // starts 5 frames after it and peaks at 7.
    beats: { labelsOut: -5, knock: 5, peak: 7 },
  });
  return elements;
});
