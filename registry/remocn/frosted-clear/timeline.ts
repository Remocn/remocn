import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The kicker and the title rising behind the frosted glass, the frost
// clearing from the middle out, the copy settling and the glass edge coming
// to rest. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type FrostedClearElementId =
  | "kicker"
  | "title"
  | "clear"
  | "settle"
  | "rest";

export interface FrostedClearTimingProps {
  /** Frames the frost takes to clear from the middle out. */
  clear?: number;
}

const CLEAR = 64;
const RISE = 26;

// `clear` runs the hole through the frost over `clear` frames; the glint
// along its front follows its progress. `settle` eases the copy's last bit
// of scale out, and `rest` brings the glass edge to its resting tone.
export const frostedClearTimeline = defineTimeline<
  FrostedClearElementId,
  FrostedClearTimingProps
>(({ clear = CLEAR }): TimelineElement<FrostedClearElementId>[] => [
  { id: "kicker", lane: "Copy", label: "kicker", start: 0, length: RISE },
  {
    id: "title",
    lane: "Copy",
    label: "title",
    start: 3,
    length: RISE,
    follows: "kicker",
  },
  {
    id: "clear",
    lane: "Glass",
    label: "frost clears",
    start: 28,
    length: clear,
    follows: "title",
  },
  { id: "settle", lane: "Copy", label: "settle", start: 52, length: 44 },
  { id: "rest", lane: "Glass", label: "edge rests", start: 80, length: 20 },
]);
