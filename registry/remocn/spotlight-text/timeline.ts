import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dim headline and its eyebrow come in, a spotlight glides across the
// headline, then eases back to the centre while it widens. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type SpotlightTextElementId = "enter" | "eyebrow" | "glide" | "widen";

export interface SpotlightTextTimingProps {
  title?: string;
  eyebrow?: string;
  sweep?: number;
}

export const DEFAULT_TITLE = "Launch videos, in code.";
export const DEFAULT_EYEBROW = "remocn 2.0";

const T = {
  inStart: 0,
  inDur: 26,
  eyebrowStart: 8,
  eyebrowEnd: 30,
  glideStart: 14,
  glideEnd: 92,
  widenEnd: 132,
};
/** The widening starts this long before the glide ends. */
const WIDEN_LEAD = 6;

// `glide` fades the light in from 4 frames before it to 14 after
// (`lightFrom`, `lightTo`); `widen` follows it.
export const spotlightTextTimeline = defineTimeline<
  SpotlightTextElementId,
  SpotlightTextTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    eyebrow = DEFAULT_EYEBROW,
    sweep = T.glideEnd - T.glideStart,
  }): TimelineElement<SpotlightTextElementId>[] => {
    const glideEnd = T.glideStart + sweep;
    const widenEnd = glideEnd + (T.widenEnd - T.glideEnd);
    return [
      {
        id: "enter",
        lane: "Headline",
        label: title,
        start: T.inStart,
        length: T.inDur,
      },
      {
        id: "eyebrow",
        lane: "Eyebrow",
        label: eyebrow,
        start: T.eyebrowStart,
        length: T.eyebrowEnd - T.eyebrowStart,
      },
      {
        id: "glide",
        lane: "Light",
        label: "glide",
        start: T.glideStart,
        length: sweep,
        beats: { lightFrom: -4, lightTo: 14 },
      },
      {
        id: "widen",
        lane: "Light",
        label: "widen",
        start: glideEnd - WIDEN_LEAD,
        length: widenEnd - (glideEnd - WIDEN_LEAD),
        follows: "glide",
      },
    ];
  },
);
