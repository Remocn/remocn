import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The figure drifting in and counting up in the dim, a pre-flash, the flash
// that lights the figure at its value, and the label fading in after it.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type FlashCountElementId = "drift" | "count" | "flash" | "label";

export interface FlashCountTimingProps {
  flashAt?: number;
}

export const FLASH_AT = 54;
const COUNT_AT = 4;
/** The pre-flash blinks from `preAt`, peaking at `prePeak`, out by `preEnd`. */
const PRE_AT = -8;
const PRE_PEAK = -7;
const PRE_END = -5;
/** The flash peaks at `popPeak` and fades by `pop`. */
const POP_PEAK = 1;
const POP = 12;
const LABEL_AT = 4;
const LABEL = 18;

// `drift` is the slow push from the start to the flash. `count` runs the
// number up to the flash, which follows it; its pre-flash is a beat before
// its start. `label` follows the flash.
export const flashCountTimeline = defineTimeline<
  FlashCountElementId,
  FlashCountTimingProps
>(({ flashAt = FLASH_AT }) => {
  const elements: TimelineElement<FlashCountElementId>[] = [
    { id: "drift", lane: "Camera", label: "drift", start: 0, length: flashAt },
    {
      id: "count",
      lane: "Figure",
      label: "count",
      start: COUNT_AT,
      length: flashAt - COUNT_AT,
    },
    {
      id: "flash",
      lane: "Figure",
      label: "flash",
      start: flashAt,
      length: POP,
      follows: "count",
      beats: {
        preAt: PRE_AT,
        prePeak: PRE_PEAK,
        preEnd: PRE_END,
        popPeak: POP_PEAK,
      },
    },
    {
      id: "label",
      lane: "Label",
      label: "label",
      start: flashAt + LABEL_AT,
      length: LABEL,
      follows: "flash",
    },
  ];
  return elements;
});
