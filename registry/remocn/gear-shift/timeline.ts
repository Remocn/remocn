import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The side panel sliding open, the figure fading in, the caption rising,
// and the count climbing through its gears: each gear runs a little longer
// in a heavier weight, with a pause between gears. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type GearShiftElementId = "panel" | "enter" | "label" | `gear:${number}`;

export interface GearShiftTimingProps {
  gears?: number;
  /** Frames the count pauses between gears. */
  pause?: number;
}

/** Weights the gears climb through, lightest first. */
export const WEIGHTS = ["200", "300", "400", "500"] as const;
const START = 6;
const SHIFT = 4;

/** How many gears the count shifts through. */
export function gearCount(gears: number) {
  return Math.max(2, Math.min(WEIGHTS.length, Math.round(gears)));
}

// `panel` is the side panel opening, `enter` the figure fading in and
// `label` the caption rising. `gear:<k>` is gear `k` of the count, the size
// growing to the gear's over `grow`; the gears chain, `pause` frames apart.
export const gearShiftTimeline = defineTimeline<
  GearShiftElementId,
  GearShiftTimingProps
>(({ gears = 4, pause = SHIFT }) => {
  const G = gearCount(gears);
  const dur = (k: number) => 9 + 3 * k;
  const out: TimelineElement<GearShiftElementId>[] = [
    { id: "panel", lane: "Panel", label: "panel", start: 0, length: 14 },
    { id: "enter", lane: "Figure", label: "enter", start: 0, length: 8 },
  ];
  let acc = START;
  for (let k = 0; k < G; k++) {
    out.push({
      id: `gear:${k}`,
      lane: "Gears",
      label: `gear ${k + 1}`,
      start: acc,
      length: dur(k),
      follows: k > 0 ? `gear:${k - 1}` : undefined,
      beats: { grow: 5 },
    });
    acc += dur(k) + (k < G - 1 ? pause : 0);
  }
  out.push({
    id: "label",
    lane: "Panel",
    label: "caption",
    start: 8,
    length: 16,
  });
  return out.sort((a, b) => a.start - b.start);
});
