import { defineTimeline } from "@/lib/remocn/timeline";

// The scan bar sweeps across the device, exposing the interior behind it.
// Frames on the 30 fps scene timeline, after `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type XRayScanElementId = "scan";

/** The scan's timing does not depend on its props. */
export type XRayScanTimingProps = object;

export const SCAN_AT = 5;
export const SCAN_END = 32;

export const xRayScanTimeline = defineTimeline<
  XRayScanElementId,
  XRayScanTimingProps
>(() => [
  {
    id: "scan",
    lane: "Scan",
    label: "scan",
    start: SCAN_AT,
    length: SCAN_END - SCAN_AT,
  },
]);
