import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The speed trap read-out: the bar track snapping out, the sector labels
// coming up, the camera's slow push, the count racing up to the lock, the
// lock kick, the banner wiping in and blinking, last year's mark dropping
// onto the bar, the delta lighting up and the comparison sliding out.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The
// component's clock runs `PREROLL` frames ahead of the scene, so frame 0
// already shows the track snapping out. The ids are public: a saved `timing`
// prop refers to them.

export type SpeedTrapElementId =
  | "track"
  | "labels"
  | "push"
  | "count"
  | "lock"
  | "banner"
  | "mark"
  | "delta"
  | "comparison";

export interface SpeedTrapTimingProps {
  lockAt?: number;
}

/** Frames the component's clock runs ahead of the scene. */
export const PREROLL = 3;

const COUNT_AT = 3;
const LOCK_AT = 42;

// `count` runs the number and the bar fill up to the lock, which follows
// it: the number kicks over the lock's length and the bar flashes white for
// `flash`. `push` is the camera pushing in up to the lock. `banner` wipes in
// over `wipe`, white for `white`, then blinks off from `blinkAt` to its end.
// `mark`, `delta` and `comparison` follow the lock.
export const speedTrapTimeline = defineTimeline<
  SpeedTrapElementId,
  SpeedTrapTimingProps
>(({ lockAt = LOCK_AT }): TimelineElement<SpeedTrapElementId>[] => [
  {
    id: "track",
    lane: "Bar",
    label: "track",
    start: 0 - PREROLL,
    length: 8,
  },
  {
    id: "push",
    lane: "Camera",
    label: "push",
    start: 0 - PREROLL,
    length: lockAt,
  },
  { id: "labels", lane: "Bar", label: "labels", start: 3 - PREROLL, length: 8 },
  {
    id: "count",
    lane: "Readout",
    label: "count",
    start: COUNT_AT - PREROLL,
    length: lockAt - COUNT_AT,
  },
  {
    id: "lock",
    lane: "Readout",
    label: "lock",
    start: lockAt - PREROLL,
    length: 9,
    follows: "count",
    beats: { flash: 2 },
  },
  {
    id: "banner",
    lane: "Banner",
    label: "banner",
    start: lockAt + 2 - PREROLL,
    length: 12,
    follows: "lock",
    beats: { wipe: 6, white: 2, blinkAt: 9 },
  },
  {
    id: "mark",
    lane: "Mark",
    label: "last year",
    start: lockAt + 8 - PREROLL,
    length: 8,
    follows: "lock",
  },
  {
    id: "delta",
    lane: "Mark",
    label: "delta",
    start: lockAt + 13 - PREROLL,
    length: 8,
    follows: "lock",
  },
  {
    id: "comparison",
    lane: "Comparison",
    label: "comparison",
    start: lockAt + 16 - PREROLL,
    length: 10,
    follows: "lock",
  },
]);
