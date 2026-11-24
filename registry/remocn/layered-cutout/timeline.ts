import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The cut sheets parting in depth, the camera dollying through the cuts, and
// the logo and tagline surfacing on the core sheet. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type LayeredCutoutElementId = "part" | "dolly" | "logo" | "tagline";

export interface LayeredCutoutTimingProps {
  push?: number;
}

const DEFAULT_PUSH = 132;

// The tagline follows the logo, starting before it has fully surfaced.
export const layeredCutoutTimeline = defineTimeline<
  LayeredCutoutElementId,
  LayeredCutoutTimingProps
>(({ push = DEFAULT_PUSH }): TimelineElement<LayeredCutoutElementId>[] => [
  {
    id: "part",
    lane: "Sheets",
    label: "sheets part",
    start: 0,
    length: 72,
  },
  {
    id: "dolly",
    lane: "Camera",
    label: "dolly through the cuts",
    start: 8,
    length: push,
  },
  {
    id: "logo",
    lane: "Core",
    label: "logo",
    start: 76,
    length: 28,
  },
  {
    id: "tagline",
    lane: "Core",
    label: "tagline",
    start: 98,
    length: 22,
    follows: "logo",
  },
]);
