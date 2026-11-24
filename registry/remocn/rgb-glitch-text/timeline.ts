import { defineTimeline } from "@/lib/remocn/timeline";

// When the colour channels split. Frames on the 30 fps scene timeline,
// after `speed`. The ids are public: a saved `timing` prop refers to them.

export type RGBGlitchTextElementId = "glitch";

export interface RGBGlitchTextTimingProps {
  glitchAt?: number;
  glitchDuration?: number;
}

const GLITCH_AT = 20;
const GLITCH_DURATION = 8;

// `glitch` is the burst: the red, green and blue copies jitter over it.
export const rgbGlitchTextTimeline = defineTimeline<
  RGBGlitchTextElementId,
  RGBGlitchTextTimingProps
>(({ glitchAt = GLITCH_AT, glitchDuration = GLITCH_DURATION }) => [
  {
    id: "glitch",
    lane: "Glitch",
    label: "glitch",
    start: glitchAt,
    length: glitchDuration,
  },
]);
