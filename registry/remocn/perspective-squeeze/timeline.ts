import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// When the blocks bend and the lines squeeze. Frames on the 30 fps scene
// timeline. The ids are public: a saved `timing` prop refers to them.

export type PerspectiveSqueezeElementId = `pin:${number}` | `squeeze:${number}`;

export interface PerspectiveSqueezeTimingProps {
  cornerKeyframes?: number[];
  scaleKeyframes?: number[];
}

const CORNER_KEYFRAMES = [0, 45, 70];
const SCALE_KEYFRAMES = [0, 60, 118, 161, 196, 225];

// Each element runs from one keyframe to the next: `pin:0` bends the blocks
// from rest to the mid pose and `pin:1` on to the end pose; `squeeze:<k>`
// eases both lines from scale keyframe k to k + 1. Each follows the one
// before it in its lane.
export const perspectiveSqueezeTimeline = defineTimeline<
  PerspectiveSqueezeElementId,
  PerspectiveSqueezeTimingProps
>(
  ({
    cornerKeyframes = CORNER_KEYFRAMES,
    scaleKeyframes = SCALE_KEYFRAMES,
  }) => {
    const [k0, k1, k2] = cornerKeyframes;
    const pins: TimelineElement<PerspectiveSqueezeElementId>[] = [
      { id: "pin:0", lane: "Pin", label: "to mid", start: k0, length: k1 - k0 },
      {
        id: "pin:1",
        lane: "Pin",
        label: "to end",
        start: k1,
        length: k2 - k1,
        follows: "pin:0",
      },
    ];
    const squeezes = scaleKeyframes.slice(1).map(
      (at, k): TimelineElement<PerspectiveSqueezeElementId> => ({
        id: `squeeze:${k}`,
        lane: "Squeeze",
        label: `key ${k + 1}`,
        start: scaleKeyframes[k],
        length: at - scaleKeyframes[k],
        follows: k > 0 ? `squeeze:${k - 1}` : undefined,
      }),
    );
    return [...pins, ...squeezes].sort((a, b) => a.start - b.start);
  },
);
