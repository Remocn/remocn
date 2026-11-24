import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The baseline guides drawing in one by one, the scan line drawing in, its
// sweep down the title developing the halftone, the sweep back up over the
// subtitle, and the line parking as a full-width rule while the guides fade.
// Frames on the 30 fps scene timeline, after `delay` and `speed`; the first
// guides start before frame 0. The ids are public: a saved `timing` prop
// refers to them.

export type ScanRevealElementId =
  | `guide:${number}`
  | "line"
  | "down"
  | "up"
  | "park";

export interface ScanRevealTimingProps {
  /** Frames the scan line takes to sweep down the title. */
  scan?: number;
}

/** How many guide lines the layout draws. */
export const GUIDES = 7;
const GUIDE_AT = -10;
const GUIDE_LEN = 24;
const GUIDE_GAP = 2;
const LINE_IN_AT = -2;
const LINE_IN = 14;
const DOWN_AT = 10;
export const DEFAULT_SCAN = 56;
const UP_AT = 71;
const UP = 18;
const PARK_AT = 89;
const PARK = 18;
/** The sheen keeps sliding this long after the line has parked. */
const SHEEN_TAIL = 40;

// `guide:<i>` draws guide `i`, each following the one before. `line` draws
// the scan line in. `down` sweeps it down the title over its length; `up`
// brings it back up over the subtitle, following `down`; `park` stretches it
// into a rule and fades the guides, following `up`. The title's sheen slides
// from the start of `down` to `tail` past the end of `park`.
export const scanRevealTimeline = defineTimeline<
  ScanRevealElementId,
  ScanRevealTimingProps
>(({ scan = DEFAULT_SCAN }) => {
  const late = scan - DEFAULT_SCAN;
  const elements: TimelineElement<ScanRevealElementId>[] = [
    ...Array.from(
      { length: GUIDES },
      (_, i): TimelineElement<ScanRevealElementId> => ({
        id: `guide:${i}`,
        lane: "Guides",
        label: `guide ${i + 1}`,
        start: GUIDE_AT + i * GUIDE_GAP,
        length: GUIDE_LEN,
        follows: i > 0 ? `guide:${i - 1}` : undefined,
      }),
    ),
    {
      id: "line",
      lane: "Line",
      label: "line in",
      start: LINE_IN_AT,
      length: LINE_IN,
    },
    {
      id: "down",
      lane: "Line",
      label: "scan down",
      start: DOWN_AT,
      length: scan,
      follows: "line",
    },
    {
      id: "up",
      lane: "Line",
      label: "scan up",
      start: UP_AT + late,
      length: UP,
      follows: "down",
    },
    {
      id: "park",
      lane: "Line",
      label: "park",
      start: PARK_AT + late,
      length: PARK,
      follows: "up",
      beats: { tail: SHEEN_TAIL },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
