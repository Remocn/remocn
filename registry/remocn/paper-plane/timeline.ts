import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A paper plane glides past three stops and lands as the full stop of the
// lockup; the url rises under it. The second and third stops react to where
// the plane and the camera are, not to the clock. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type PaperPlaneElementId = "intro" | "flight" | "landing" | "url";

export interface PaperPlaneTimingProps {
  /** Frame the plane touches down; the flight stretches or tightens to fit. */
  land?: number;
}

/** Frame the plane touches down. */
const LAND = 184;

// The flight runs from frame 0 to touchdown, easing off over its last
// `ease` frames. The landing sits on touchdown: the camera settles onto the
// lockup, the plane loses height and folds into the dot before it (negative
// beats), and the dot pops after.
export const paperPlaneTimeline = defineTimeline<
  PaperPlaneElementId,
  PaperPlaneTimingProps
>(({ land = LAND }): TimelineElement<PaperPlaneElementId>[] => [
  {
    id: "intro",
    lane: "Stops",
    label: "first stop",
    start: -8,
    length: 22,
  },
  {
    id: "flight",
    lane: "Plane",
    label: "flight",
    start: 0,
    length: land,
    beats: { ease: 36 },
  },
  {
    id: "landing",
    lane: "Plane",
    label: "landing",
    start: land,
    length: 16,
    follows: "flight",
    beats: {
      cameraAt: -60,
      cameraEnd: 6,
      descendAt: -40,
      morphAt: -14,
      dotAt: -3,
      dotEnd: 4,
      popPeak: 6,
      dimAt: -6,
      dimEnd: 30,
    },
  },
  {
    id: "url",
    lane: "Url",
    label: "url",
    start: land + 8,
    length: 20,
    follows: "landing",
  },
]);
