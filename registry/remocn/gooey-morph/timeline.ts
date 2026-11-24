import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When each bar travels to its rest and when the bars melt into the word.
// Frames on the 30 fps scene timeline. The ids are public: a saved `timing`
// prop refers to them.

export type GooeyMorphElementId = `bar:${number}` | "morph";

export interface GooeyMorphTimingProps {
  barRestPositions?: [number, number][];
  barEntryFrames?: number[];
  barTravelFrames?: number;
  word?: string;
  morphStartFrame?: number;
  morphPeakFrame?: number;
  morphEndFrame?: number;
}

export const DEFAULT_BAR_REST_POSITIONS: [number, number][] = [
  [634.9, 538.9],
  [852.5, 538.9],
  [1070.2, 538.9],
  [1287.9, 538.9],
];
export const DEFAULT_WORD = "HELLO";
const BAR_ENTRY_FRAMES = [8, 0, 4, 13];
const BAR_TRAVEL_FRAMES = 30;
const MORPH_START = 50;
const MORPH_PEAK = 63;
const MORPH_END = 76;

// A bar slides across over the first half of its travel (`turn`) and drops
// into line over the second. The morph blurs up to its `peak` and back, and
// follows the bar that lands last.
export const gooeyMorphTimeline = defineTimeline<
  GooeyMorphElementId,
  GooeyMorphTimingProps
>(
  ({
    barRestPositions = DEFAULT_BAR_REST_POSITIONS,
    barEntryFrames = BAR_ENTRY_FRAMES,
    barTravelFrames = BAR_TRAVEL_FRAMES,
    word = DEFAULT_WORD,
    morphStartFrame = MORPH_START,
    morphPeakFrame = MORPH_PEAK,
    morphEndFrame = MORPH_END,
  }) => {
    const bars = barRestPositions.map(
      (_, i): TimelineElement<GooeyMorphElementId> => ({
        id: `bar:${i}`,
        lane: "Bars",
        label: `bar ${i + 1}`,
        start: barEntryFrames[i] ?? 0,
        length: barTravelFrames,
        beats: { turn: barTravelFrames / 2 },
      }),
    );
    const landed = bars.reduce<TimelineElement<GooeyMorphElementId> | null>(
      (last, bar) =>
        bar.start + bar.length <= morphStartFrame &&
        (!last || bar.start + bar.length > last.start + last.length)
          ? bar
          : last,
      null,
    );
    const morph: TimelineElement<GooeyMorphElementId> = {
      id: "morph",
      lane: "Morph",
      label: word,
      start: morphStartFrame,
      length: morphEndFrame - morphStartFrame,
      follows: landed?.id,
      beats: { peak: morphPeakFrame - morphStartFrame },
    };
    return [...bars, morph].sort((a, b) => a.start - b.start);
  },
);
