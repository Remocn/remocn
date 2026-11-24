import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The glass bands sweeping down across the type. The wave and the
// turbulence keep moving for as long as the scene runs and are not elements.
// Frames on the 30 fps scene timeline. The ids are public: a saved `timing`
// prop refers to them.

export type ChromaticWaveElementId = "sweep";

export interface ChromaticWaveTimingProps {
  /** Frames the bands take to travel from `mapStartY` to `mapEndY`. */
  mapTravelFrames?: number;
}

const MAP_TRAVEL_FRAMES = 150;

export const chromaticWaveTimeline = defineTimeline<
  ChromaticWaveElementId,
  ChromaticWaveTimingProps
>(
  ({
    mapTravelFrames = MAP_TRAVEL_FRAMES,
  }): TimelineElement<ChromaticWaveElementId>[] => [
    {
      id: "sweep",
      lane: "Bands",
      label: "band sweep",
      start: 0,
      length: mapTravelFrames,
    },
  ],
);
