import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The rows wiping in from the center outward and the accent band growing
// across the middle row. The rows' cruise runs for as long as the scene does
// and is not an element. Frames on the 30 fps scene timeline, after `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type TypeWallElementId = "rows" | "band";

/** The scene's timing does not depend on its props. */
export type TypeWallTimingProps = object;

/** A row wipes in over `ENTRANCE`, `STAGGER` later for each row from the center. */
export const ENTRANCE = 20;
export const STAGGER = 2;
/** The accent band grows over these frames. */
export const BAND = [6, 20] as const;

// `rows` is the center row's entrance; the row `k` away from the center
// starts `k` times its `stagger` beat later. How many rows there are depends
// on the frame height, not on the schedule.
export const typeWallTimeline = defineTimeline<
  TypeWallElementId,
  TypeWallTimingProps
>((): TimelineElement<TypeWallElementId>[] => [
  {
    id: "rows",
    lane: "Rows",
    label: "rows",
    start: 0,
    length: ENTRANCE,
    beats: { stagger: STAGGER },
  },
  {
    id: "band",
    lane: "Band",
    label: "band",
    start: BAND[0],
    length: BAND[1] - BAND[0],
  },
]);
