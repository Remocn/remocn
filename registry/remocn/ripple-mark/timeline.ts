import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A pulse at the center sends a ripple through the dot field; the dots
// inside the mark swell and light up as it passes. The mark then pans aside
// and the name's letters slide in one after another, while the camera eases
// out over the whole scene. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type RippleMarkElementId =
  | "camera"
  | "ripple"
  | "pan"
  | `letter:${number}`;

export interface RippleMarkTimingProps {
  logo?: string | string[];
  name?: string;
  stagger?: number;
}

const RIPPLE_AT = 7;
const PAN_AT = 46;
const PAN_DUR = 30;
const WORD_AT = 56;

/**
 * The word set beside the mark: with the default mark and "remocn" the R
 * stands in for the first letter, so only "emocn" follows it.
 */
export function rippleWordOf(
  logo: string | string[] | undefined,
  name: string,
) {
  const brand = !logo && name.trim().toLowerCase() === "remocn";
  return brand ? "emocn" : name;
}

// `camera` eases the slight zoom out over its length. `ripple` leaves the
// center: the center dots pulse from `pulse` (before the start) to
// `pulseEnd`, and each dot the wave reaches swells over `grow` inside the
// mark or settles over `settle` outside it. `pan` slides the mark aside over
// its length. `letter:<i>` slides letter `i` of the name in over its length
// (a chain, `stagger` apart).
export const rippleMarkTimeline = defineTimeline<
  RippleMarkElementId,
  RippleMarkTimingProps
>(({ logo, name = "remocn", stagger = 2.5 }) => {
  const letters = rippleWordOf(logo, name).split("");
  const elements: TimelineElement<RippleMarkElementId>[] = [
    {
      id: "camera",
      lane: "Camera",
      label: "Zoom out",
      start: 0,
      length: PAN_AT + PAN_DUR + 40,
    },
    {
      id: "ripple",
      lane: "Dots",
      label: "Ripple",
      start: RIPPLE_AT,
      length: 40,
      beats: { pulse: -RIPPLE_AT, pulseEnd: 6, grow: 14, settle: 18 },
    },
    { id: "pan", lane: "Mark", label: "Pan", start: PAN_AT, length: PAN_DUR },
  ];
  letters.forEach((ch, i) => {
    elements.push({
      id: `letter:${i}`,
      lane: "Name",
      label: ch,
      start: WORD_AT + i * stagger,
      length: 16,
      follows: i > 0 ? `letter:${i - 1}` : undefined,
    });
  });
  return elements;
});
