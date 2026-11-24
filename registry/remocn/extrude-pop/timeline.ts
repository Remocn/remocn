import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The letters extruding out of the page. Frames on the 30 fps scene
// timeline. The ids are public: a saved `timing` prop refers to them.

export type ExtrudePopElementId = "extrude";

export interface ExtrudePopTimingProps {
  extrudeStartFrame?: number;
  extrudeEndFrame?: number;
}

const EXTRUDE_START = 0;
const EXTRUDE_END = 48;

export const extrudePopTimeline = defineTimeline<
  ExtrudePopElementId,
  ExtrudePopTimingProps
>(
  ({
    extrudeStartFrame = EXTRUDE_START,
    extrudeEndFrame = EXTRUDE_END,
  }): TimelineElement<ExtrudePopElementId>[] => [
    {
      id: "extrude",
      lane: "Letters",
      label: "Extrude",
      start: extrudeStartFrame,
      length: extrudeEndFrame - extrudeStartFrame,
    },
  ],
);
