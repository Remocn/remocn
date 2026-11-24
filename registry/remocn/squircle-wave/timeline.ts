import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The grid rippling in from the center, then the wave crossing it and
// leaving the mark behind. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type SquircleWaveElementId = "grid" | "wave";

export interface SquircleWaveTimingProps {
  sweep?: number;
}

const WAVE_START = 2;
const WAVE_END = 72;
/** Frames the wave takes to cross the frame by default. */
const DEFAULT_SWEEP = WAVE_END - WAVE_START;

// `grid` brings the cells in from the center outwards: a cell starts
// `spread` frames per 60 px of its distance from the center (1 at rest,
// stretched with the element) and fades in over `fade`. `wave` sweeps the
// front across the frame; the ground light keeps drifting `drift` frames past
// its end.
export const squircleWaveTimeline = defineTimeline<
  SquircleWaveElementId,
  SquircleWaveTimingProps
>(({ sweep = DEFAULT_SWEEP }) => {
  const elements: TimelineElement<SquircleWaveElementId>[] = [
    {
      id: "grid",
      lane: "Grid",
      label: "Grid",
      start: 0,
      length: 21,
      beats: { spread: 1, fade: 9 },
    },
    {
      id: "wave",
      lane: "Wave",
      label: "Wave",
      start: WAVE_START,
      length: sweep,
      beats: { drift: 40 },
    },
  ];
  return elements;
});
