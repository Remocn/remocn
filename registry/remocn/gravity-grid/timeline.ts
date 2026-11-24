import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A mass appears and falls into the grid, pulling a well; it lands, the well
// overshoots and one ripple runs out, the camera tilts down after it, and
// the name and caption rise at the bottom of the well. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type GravityGridElementId =
  | "camera"
  | "mass"
  | "impact"
  | "lockup"
  | "caption";

export interface GravityGridTimingProps {
  name?: string;
  caption?: string;
  impactAt?: number;
}

export const DEFAULT_NAME = "remocn";
export const DEFAULT_CAPTION = "Launch videos, in components.";
export const IMPACT = 72;
const FOLLOW_AT = 10;
const FALL_AT = 14;
/** The ripple has mostly died out this long after the impact. */
const RIPPLE = 60;

// The camera follows the mass down until `18` frames after the impact. The
// mass fades in over `appear`–`appearEnd` around the start of its fall and
// out over `fade`–`fadeEnd` around the impact. The lockup and caption rise
// after the impact.
export const gravityGridTimeline = defineTimeline<
  GravityGridElementId,
  GravityGridTimingProps
>(
  ({
    name = DEFAULT_NAME,
    caption = DEFAULT_CAPTION,
    impactAt: impact = IMPACT,
  }) => {
    const elements: TimelineElement<GravityGridElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "Camera tilts down",
        start: FOLLOW_AT,
        length: impact + 18 - FOLLOW_AT,
      },
      {
        id: "mass",
        lane: "Mass",
        label: "Mass falls",
        start: FALL_AT,
        length: impact - FALL_AT,
        beats: { appear: FOLLOW_AT - FALL_AT, appearEnd: 22 - FALL_AT },
      },
      {
        id: "impact",
        lane: "Mass",
        label: "Impact and ripple",
        start: impact,
        length: RIPPLE,
        follows: "mass",
        beats: { fade: -2, fadeEnd: 10 },
      },
      {
        id: "lockup",
        lane: "Lockup",
        label: name,
        start: impact + 6,
        length: 26,
        follows: "mass",
      },
      {
        id: "caption",
        lane: "Caption",
        label: caption || "Caption",
        start: impact + 18,
        length: 22,
        follows: "mass",
      },
    ];
    return elements;
  },
);
