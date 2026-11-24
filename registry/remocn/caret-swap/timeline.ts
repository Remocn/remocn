import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The caret showing at the end of the first line, stretching over it and
// collapsing to the left, then typing the second line and blinking. Frames
// on the 30 fps scene timeline, after `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type CaretSwapElementId =
  | "caret"
  | "expand"
  | "collapse"
  | "type"
  | "blink";

export interface CaretSwapTimingProps {
  toText: string;
  swapAt?: number;
  typeSpeed?: number;
}

export const SWAP_AT = 20;
export const TYPE_SPEED = 1;
/** The caret shows this long before it starts to stretch. */
const CARET_LEAD = 7;
export const EXPAND_FRAMES = 6;
export const COLLAPSE_FRAMES = 7;
export const IDLE_FRAMES = 7;
const BLINK_FRAMES = 8;
const TYPE_ACCEL = 0.96;

/** Frames from the first character to the `count`-th, speeding up. */
export function typeElapsed(count: number, typeSpeed: number): number {
  return (typeSpeed * (1 - TYPE_ACCEL ** count)) / (1 - TYPE_ACCEL);
}

// Each phase follows the one before it. `type` types a character when
// `typeElapsed` at its `pace` beat has passed since its start, so stretching
// it slows the typing; `blink` blinks every `period` once a period has gone.
export const caretSwapTimeline = defineTimeline<
  CaretSwapElementId,
  CaretSwapTimingProps
>(({ toText, swapAt = SWAP_AT, typeSpeed = TYPE_SPEED }, { length }) => {
  const caretVisibleAt = Math.max(swapAt - CARET_LEAD, 0);
  const expandEnd = swapAt + EXPAND_FRAMES;
  const collapseEnd = expandEnd + COLLAPSE_FRAMES;
  const typeStart = collapseEnd + IDLE_FRAMES;
  const typing = typeElapsed(Array.from(toText).length, typeSpeed);
  const typeEnd = typeStart + typing;
  const elements: TimelineElement<CaretSwapElementId>[] = [
    {
      id: "caret",
      lane: "Caret",
      label: "caret",
      start: caretVisibleAt,
      length: swapAt - caretVisibleAt,
    },
    {
      id: "expand",
      lane: "Caret",
      label: "stretch",
      start: swapAt,
      length: EXPAND_FRAMES,
      follows: "caret",
    },
    {
      id: "collapse",
      lane: "Caret",
      label: "collapse",
      start: expandEnd,
      length: COLLAPSE_FRAMES,
      follows: "expand",
    },
    {
      id: "type",
      lane: "Text",
      label: toText,
      start: typeStart,
      length: typing,
      follows: "collapse",
      beats: { pace: typeSpeed },
    },
    {
      id: "blink",
      lane: "Caret",
      label: "blink",
      start: typeEnd,
      length: Math.max(length - typeEnd, 0),
      follows: "type",
      beats: { period: BLINK_FRAMES },
    },
  ];
  return elements;
});
