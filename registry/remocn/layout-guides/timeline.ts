import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The layout guides: the column edges dropping in one after another, the
// highlighted column filling, the ruler measuring, then the now line sliding
// across. Frames on the 30 fps scene timeline, after `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type LayoutGuidesElementId =
  | `column:${number}`
  | "highlight"
  | "ruler"
  | "now";

export interface LayoutGuidesTimingProps {
  guides?: {
    columns: readonly number[];
    highlight?: { label: string };
    ruler?: { label: string };
    now?: { label: string };
  };
  children?: unknown;
}

/** Frame the first guide starts dropping. */
const START = 8;
/**
 * The demo dashboard's guides (`DEMO.after.guides` in audit-core): six column
 * edges, a highlight, a ruler and a now line.
 */
const DEMO_GUIDES = {
  columns: [0, 0, 0, 0, 0, 0],
  highlight: { label: "Mon 2 · today" },
  ruler: { label: "gutter" },
  now: { label: "10:15 AM" },
};

// `column:<i>` drops guide i in over its length; the guides form a chain.
// `highlight` fills the column, outlines its header from `headerAt` and pops
// its label at `labelAt`. `ruler` draws the measurement; `now` slides the
// now line across with its label.
export const layoutGuidesTimeline = defineTimeline<
  LayoutGuidesElementId,
  LayoutGuidesTimingProps
>(({ guides, children }) => {
  const spec = guides ?? (children ? undefined : DEMO_GUIDES);
  if (!spec) return [];
  const elements: TimelineElement<LayoutGuidesElementId>[] = spec.columns.map(
    (_, i) => ({
      id: `column:${i}`,
      lane: "Guides",
      label: `column ${i + 1}`,
      start: START + i * 3,
      length: 16,
      follows: i > 0 ? `column:${i - 1}` : undefined,
    }),
  );
  if (spec.highlight) {
    elements.push({
      id: "highlight",
      lane: "Highlight",
      label: spec.highlight.label,
      start: START + 14,
      length: 14,
      beats: { headerAt: 6, labelAt: 12 },
    });
  }
  if (spec.ruler) {
    elements.push({
      id: "ruler",
      lane: "Ruler",
      label: spec.ruler.label,
      start: START + 24,
      length: 12,
    });
  }
  if (spec.now) {
    elements.push({
      id: "now",
      lane: "Now",
      label: spec.now.label,
      start: START + 30,
      length: 16,
    });
  }
  return elements.sort((a, b) => a.start - b.start);
});
