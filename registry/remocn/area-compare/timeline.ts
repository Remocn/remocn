import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The area compare: the big shape fading in, then shrinking to the new value
// while it glides aside and leaves a ghost of its old size, the after tag
// landing, and the ratio rising letter by letter beside it with its label and
// verdict, under a slow mesh drift. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type AreaCompareElementId =
  | "enter"
  | "drift"
  | "shrink"
  | "glide"
  | "land"
  | "ratio";

export interface AreaCompareTimingProps {
  shrink?: number;
}

const T_IN = 0;
const T_SHRINK = 38;
export const SHRINK_LEN = 40;

// `enter` fades the shape in. `shrink` shrinks it over its length, fading
// the ghost in over `ghost`, the before tag from `tagAt` to `tag` and the
// eyebrow out from `eyebrowAt` to `eyebrow`. `glide` carries the shape
// aside. `land` follows the shrink: the after tag comes in from `tagAt` to
// `tag` and, when the value no longer fits inside, the outside value from
// `outsideAt` to `outside`. `ratio` follows the shrink too: letter `i` of
// the ratio rises at `i` × `stagger` over `rise`, the label from `labelAt`
// to `label`, the verdict from `verdictAt` to `verdict`. `drift` is the
// mesh drift and the breathing, ending 90 frames after the landing.
export const areaCompareTimeline = defineTimeline<
  AreaCompareElementId,
  AreaCompareTimingProps
>(({ shrink = SHRINK_LEN }): TimelineElement<AreaCompareElementId>[] => {
  const T_LAND = T_SHRINK + shrink;
  const elements: TimelineElement<AreaCompareElementId>[] = [
    {
      id: "enter",
      lane: "Shape",
      label: "fade in",
      start: T_IN - 8,
      length: 24,
    },
    {
      id: "drift",
      lane: "Background",
      label: "drift",
      start: 0,
      length: T_LAND + 90,
    },
    {
      id: "shrink",
      lane: "Shape",
      label: "shrink",
      start: T_SHRINK,
      length: shrink,
      beats: {
        ghost: 10,
        tagAt: 14,
        tag: 30,
        eyebrowAt: -2,
        eyebrow: 10,
      },
    },
    {
      id: "glide",
      lane: "Camera",
      label: "glide",
      start: T_SHRINK + 6,
      length: T_LAND + 14 - (T_SHRINK + 6),
    },
    {
      id: "land",
      lane: "Labels",
      label: "land",
      start: T_LAND,
      length: 14,
      follows: "shrink",
      beats: { tagAt: -4, tag: 14, outsideAt: -6, outside: 12 },
    },
    {
      id: "ratio",
      lane: "Ratio",
      label: "ratio",
      start: T_LAND + 2,
      length: 30,
      follows: "shrink",
      beats: {
        stagger: 3,
        rise: 22,
        labelAt: -4,
        label: 14,
        verdictAt: 10,
        verdict: 30,
      },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
