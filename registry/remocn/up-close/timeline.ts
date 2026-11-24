import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The close-up fading in, its line rising in, the pull back to the whole
// shot with the zoom readout, and the wide line rising in after it. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The beats are
// written for a 125-frame clip and scale with the clip's length (`k`). The
// ids are public: a saved `timing` prop refers to them.

export type UpCloseElementId = "shot" | "close" | "pull" | "wide";

export interface UpCloseTimingProps {
  pullAt?: number;
}

const PULL_AT = 44;
const FADE = 8;
const CLOSE_AT = 6;
const CLOSE = 14;
/** Frames the heavy pull-back spring takes to settle. */
const PULL = 21;
const READOUT = 10;
const WIDE_AT = 20;
const WIDE = 14;
const LIFT_AT = -6;
const LIFT_END = 12;

// `shot` is the close-up fading in; it creeps in until `pull`. `pull` is the
// spring back to the whole shot: the readout fades in over `readout` and the
// image settles until `settle` (the clip's end). `wide` follows the pull; the
// close line lifts out of its way from `liftAt` to `liftEnd`.
export const upCloseTimeline = defineTimeline<
  UpCloseElementId,
  UpCloseTimingProps
>(({ pullAt = PULL_AT }, { length }) => {
  const k = Math.min(1.6, Math.max(0.6, length / 125));
  const pullStart = pullAt * k;
  const elements: TimelineElement<UpCloseElementId>[] = [
    {
      id: "shot",
      lane: "Shot",
      label: "close-up",
      start: 0,
      length: FADE * k,
    },
    {
      id: "close",
      lane: "Lines",
      label: "close line",
      start: CLOSE_AT * k,
      length: CLOSE * k,
    },
    {
      id: "pull",
      lane: "Shot",
      label: "pull back",
      start: pullStart,
      length: PULL,
      beats: { readout: READOUT * k, settle: length - pullStart },
    },
    {
      id: "wide",
      lane: "Lines",
      label: "wide line",
      start: pullStart + WIDE_AT * k,
      length: WIDE * k,
      follows: "pull",
      beats: { liftAt: LIFT_AT * k, liftEnd: LIFT_END * k },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
