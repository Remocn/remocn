import { defineTimeline } from "@/lib/remocn/timeline";

export type ClothRevealElementId = "pull";

export interface ClothRevealTimingProps {
  delay?: number;
}

export const CLOTH_DELAY = 6;
/** At the defaults the yank clears the frame this long after the tug starts. */
export const CLOTH_PULL = 28;

// The hand tugs the corner at `delay` and yanks the sheet off. The cloth is a
// simulation baked from frame 0, so the component plays it back at the
// pull's start and pace rather than re-timing parts of it.
export const clothRevealTimeline = defineTimeline<
  ClothRevealElementId,
  ClothRevealTimingProps
>(({ delay = CLOTH_DELAY }) => [
  {
    id: "pull",
    lane: "Cloth",
    label: "Pull",
    start: delay,
    length: CLOTH_PULL,
  },
]);
