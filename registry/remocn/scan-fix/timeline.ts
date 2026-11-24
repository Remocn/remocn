import { defineTimeline } from "@/lib/remocn/timeline";

// The scan band sweeping down the frame, turning the "before" build into the
// "after" one as it passes. Frames on the 30 fps scene timeline, after
// `speed`. The id is public: a saved `timing` prop refers to it.

export type ScanFixElementId = "scan";

const SCAN_START = 18;
const SCAN_LENGTH = 80;

// `scan` moves the band from the top edge to the bottom over its length. The
// band fades in from `bandIn` to `bandOn` and out from `bandOff` to
// `bandGone`, counted from the scan's start.
export const scanFixTimeline = defineTimeline<ScanFixElementId, object>(() => [
  {
    id: "scan",
    lane: "Scan",
    label: "Scan",
    start: SCAN_START,
    length: SCAN_LENGTH,
    beats: {
      bandIn: -4,
      bandOn: 2,
      bandOff: SCAN_LENGTH - 6,
      bandGone: SCAN_LENGTH + 2,
    },
  },
]);
