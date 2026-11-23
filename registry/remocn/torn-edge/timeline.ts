import { defineTimeline } from "@/lib/remocn/timeline";

// The tear running across the sheet, then the two halves parting to show the
// headline. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type TornEdgeElementId = "tear" | "part";

export interface TornEdgeTimingProps {
  /** Frames the tear takes to cross the sheet. */
  tear?: number;
}

const TEAR_START = 2;
const TEAR = 34;
/** The halves start parting this long before the tear is through. */
const PART_LEAD = 4;
const PART = 38;
/** The camera push and the ground drift run this long past the part. */
const PUSH_TAIL = 40;
/** The headline settles this long past the part. */
const SETTLE_TAIL = 6;

export const tornEdgeTimeline = defineTimeline<
  TornEdgeElementId,
  TornEdgeTimingProps
>(({ tear = TEAR }) => {
  const tearEnd = TEAR_START + tear;
  return [
    {
      id: "tear",
      lane: "Tear",
      label: "tear",
      start: TEAR_START,
      length: tear,
    },
    {
      id: "part",
      lane: "Part",
      label: "part",
      start: tearEnd - PART_LEAD,
      length: PART,
      follows: "tear",
      beats: { push: PUSH_TAIL, settle: SETTLE_TAIL },
    },
  ];
});
