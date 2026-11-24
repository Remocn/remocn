import { defineTimeline } from "@/lib/remocn/timeline";

// The pins fade up, the threads are strung one pin after another, then the
// multiplier walks from `from` to `to` and the figure morphs. Frames on the
// 30 fps scene timeline, after `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type StringArtElementId = "pins" | "string" | "morph";

export interface StringArtTimingProps {
  stringFrames?: number;
  morphFrames?: number;
}

const STRING_FRAMES = 60;
const MORPH_FRAMES = 240;
const PINS_IN = 12;
const MORPH_DELAY = 24;
/** The label fades in from `LABEL_AT` around the last thread, over `LABEL`. */
const LABEL_AT = -10;
const LABEL = 16;

// `pins` fades the pins in. `string` strings the threads over its length;
// the label fades in from `labelAt` (relative to its end) over `label`, and
// the accent sweep keeps circling after it ends. `morph` walks the
// multiplier through each integer table over its length.
export const stringArtTimeline = defineTimeline<
  StringArtElementId,
  StringArtTimingProps
>(({ stringFrames = STRING_FRAMES, morphFrames = MORPH_FRAMES }) => {
  // interpolate() needs a strictly increasing range.
  const strung = Math.max(1, stringFrames);
  return [
    { id: "pins", lane: "Pins", label: "Pins", start: 0, length: PINS_IN },
    {
      id: "string",
      lane: "Threads",
      label: "String",
      start: 0,
      length: strung,
      beats: { labelAt: LABEL_AT, label: LABEL },
    },
    {
      id: "morph",
      lane: "Threads",
      label: "Morph",
      start: strung + MORPH_DELAY,
      length: Math.max(1, morphFrames),
      follows: "string",
    },
  ];
});
