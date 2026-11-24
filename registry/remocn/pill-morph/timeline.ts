import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A pill springs in, opens into a card with an editor inside, collapses into
// a bar that splits into three feature pills, and the pills merge into the
// tile with the mark and the name under it. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type PillMorphElementId =
  | "appear"
  | "drift"
  | "open"
  | "content"
  | "collapse"
  | "split"
  | `feature:${number}`
  | "merge"
  | "settle"
  | "mark"
  | "name";

export interface PillMorphTimingProps {
  features?: [string, string, string];
  name?: string;
}

export const DEFAULT_FEATURES: [string, string, string] = [
  "Transitions",
  "Captions",
  "Backgrounds",
];
/** Settling time of the card, morph and chip springs. */
const CARD_SETTLE = 16;
const MORPH_SETTLE = 23;
const CHIP_SETTLE = 14;

// `appear` springs the pill in (it starts before the scene) and fades its
// label in from `labelAt` over `label`. `drift` is the slow push over the
// shot. `open` widens the pill into the card, its height following
// `heightAt` later. `content` fades the editor in: its rows `rowStagger`
// apart over `row`, the playhead running from `playAt` over `play`.
// `collapse` folds the card into the bar: the editor fades from
// `contentOut` over `contentFade`, the label from `labelOutAt` over
// `labelOut`. `split` cuts the bar into pills, `feature:<i>` fades feature
// `i` in, a chain. `merge` pulls the pills into the tile: the features fade
// from `featOut`, `featStagger` apart, over `featFade`; the tile fills from
// `fillAt` over `fill` and glows from `glowAt` over `glow`. `settle` bumps
// the tile, then `mark` and `name` fade in.
export const pillMorphTimeline = defineTimeline<
  PillMorphElementId,
  PillMorphTimingProps
>(({ features = DEFAULT_FEATURES, name = "" }) => {
  const elements: TimelineElement<PillMorphElementId>[] = [
    {
      id: "appear",
      lane: "Pill",
      label: "Appear",
      start: -4,
      length: CARD_SETTLE,
      beats: { labelAt: 2, label: 11 },
    },
    { id: "drift", lane: "Camera", label: "Drift", start: 0, length: 240 },
    {
      id: "open",
      lane: "Pill",
      label: "Open",
      start: 18,
      length: 6 + MORPH_SETTLE,
      beats: { heightAt: 6 },
    },
    {
      id: "content",
      lane: "Editor",
      label: "Editor",
      start: 34,
      length: 18,
      beats: { row: 16, rowStagger: 3, playAt: 6, play: 70 },
    },
    {
      id: "collapse",
      lane: "Pill",
      label: "Collapse",
      start: 102,
      length: 14,
      beats: { contentOut: -6, contentFade: 10, labelOutAt: 1, labelOut: 9 },
    },
    {
      id: "split",
      lane: "Pill",
      label: "Split",
      start: 116,
      length: CARD_SETTLE,
      follows: "collapse",
    },
    ...features.map(
      (feature, i): TimelineElement<PillMorphElementId> => ({
        id: `feature:${i}`,
        lane: "Features",
        label: feature,
        start: 122 + i * 3,
        length: 14,
        follows: i > 0 ? `feature:${i - 1}` : "split",
      }),
    ),
    {
      id: "merge",
      lane: "Pill",
      label: "Merge",
      start: 168,
      length: MORPH_SETTLE,
      beats: {
        featOut: -4,
        featFade: 8,
        featStagger: 2,
        fillAt: 8,
        fill: 18,
        glowAt: 10,
        glow: 22,
      },
    },
    {
      id: "settle",
      lane: "Tile",
      label: "Settle",
      start: 182,
      length: CHIP_SETTLE,
      follows: "merge",
    },
    {
      id: "mark",
      lane: "Mark",
      label: "Mark",
      start: 186,
      length: 16,
      follows: "merge",
    },
    {
      id: "name",
      lane: "Mark",
      label: name || "Name",
      start: 196,
      length: 20,
      follows: "mark",
    },
  ];
  return elements;
});
