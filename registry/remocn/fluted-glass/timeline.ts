import { defineTimeline } from "@/lib/remocn/timeline";

// The orb drifts in beside the title, then a sheet of fluted glass sweeps
// across the frame and leaves the scene sharp. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type FlutedGlassElementId = "orb" | "sweep";

export interface FlutedGlassTimingProps {
  sweep?: number;
}

export const flutedGlassTimeline = defineTimeline<
  FlutedGlassElementId,
  FlutedGlassTimingProps
>(({ sweep = 46 }) => [
  { id: "orb", lane: "Orb", label: "orb drifts in", start: 0, length: 62 },
  {
    id: "sweep",
    lane: "Glass",
    label: "glass sweeps",
    start: 66,
    length: sweep,
  },
]);
