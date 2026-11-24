import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The camera's slow orbit and dolly-in, the slices of the numeral fading
// up and docking into one solid, the shadow and the disc of light behind
// it, the specular sweep, then the name, the divider and the label under
// it. Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// ids are public: a saved `timing` prop refers to them.

export type VersionHeroElementId =
  | "appear"
  | "orbit"
  | "dolly"
  | "dock"
  | "shadow"
  | "glow"
  | "sweep"
  | "name"
  | "divider"
  | "label";

export interface VersionHeroTimingProps {
  stagger?: number;
}

/** Slices the numeral is cut into along its depth. */
export const SLICES = 10;

// In `appear` slice `k` fades up from `start + k * step` over `each`
// (it starts before the scene). In `dock` slice `k` slides home from
// `start + k * stagger` over `each`. The name, the divider and the label
// form a chain.
export const versionHeroTimeline = defineTimeline<
  VersionHeroElementId,
  VersionHeroTimingProps
>(({ stagger = 2.2 }): TimelineElement<VersionHeroElementId>[] => [
  {
    id: "appear",
    lane: "Numeral",
    label: "slices appear",
    start: -6,
    length: (SLICES - 1) * 1.6 + 14,
    beats: { step: 1.6, each: 14 },
  },
  { id: "orbit", lane: "Camera", label: "orbit", start: 0, length: 150 },
  { id: "dolly", lane: "Camera", label: "dolly in", start: 0, length: 70 },
  {
    id: "dock",
    lane: "Numeral",
    label: "slices dock",
    start: 4,
    length: (SLICES - 1) * stagger + 34,
    beats: { stagger, each: 34 },
  },
  { id: "shadow", lane: "Light", label: "shadow", start: 10, length: 50 },
  { id: "glow", lane: "Light", label: "disc of light", start: 20, length: 76 },
  { id: "sweep", lane: "Numeral", label: "sweep", start: 44, length: 48 },
  { id: "name", lane: "Label", label: "name", start: 62, length: 24 },
  {
    id: "divider",
    lane: "Label",
    label: "divider",
    start: 65,
    length: 24,
    follows: "name",
  },
  {
    id: "label",
    lane: "Label",
    label: "label",
    start: 68,
    length: 24,
    follows: "divider",
  },
]);
