import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The logo bounces off the frame edges until it hits the corner dead on,
// light blooms out of the corner, the logo glides to the center into the
// lockup and the line rises under it. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type BounceLogoElementId = "bounce" | "hit" | "resolve" | "line";

export interface BounceLogoTimingProps {
  line?: string;
  cornerAt?: number;
}

export const DEFAULT_LINE = "Hit the corner.";
export const CORNER = 112;
const BLOOM = 26;
const RESOLVE_AT = CORNER + 4;
const RESOLVE = 22;
const LINE_AT = CORNER + 22;
const LINE_RISE = 16;

// The bounce runs up to the corner hit; the path is solved back from where
// it ends. The hit blooms over its length, with a burst peaking at `burst`
// and settling by `burstEnd`. The resolve and the line follow the bounce.
export const bounceLogoTimeline = defineTimeline<
  BounceLogoElementId,
  BounceLogoTimingProps
>(({ line = DEFAULT_LINE, cornerAt = CORNER }) => {
  const corner = cornerAt;
  const resolveAt = corner + RESOLVE_AT - CORNER;
  const lineAt = corner + LINE_AT - CORNER;
  const elements: TimelineElement<BounceLogoElementId>[] = [
    {
      id: "bounce",
      lane: "Logo",
      label: "Bounce",
      start: 0,
      length: corner,
    },
    {
      id: "hit",
      lane: "Bloom",
      label: "Corner hit",
      start: corner,
      length: BLOOM,
      follows: "bounce",
      beats: { burst: 1, burstEnd: 12 },
    },
    {
      id: "resolve",
      lane: "Logo",
      label: "Lockup",
      start: resolveAt,
      length: RESOLVE,
      follows: "bounce",
    },
    {
      id: "line",
      lane: "Line",
      label: line || "Line",
      start: lineAt,
      length: LINE_RISE,
      follows: "bounce",
    },
  ];
  return elements;
});
