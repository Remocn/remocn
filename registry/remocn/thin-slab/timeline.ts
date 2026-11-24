import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The before/after slab: the frame wiping in, the title and the number
// rolling up, the ghost of the old thickness appearing, the labels swapping,
// the slab squeezing to its new thickness while the number counts, then the
// callout rolling in and the sheen crossing the slab. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type ThinSlabElementId =
  | "wipe"
  | "title"
  | "number"
  | "ghost"
  | "labels"
  | "squeeze"
  | "callout"
  | "sheen";

export interface ThinSlabTimingProps {
  squeezeDuration?: number;
}

const SQUEEZE = 36;

// `squeeze` reshapes the slab and counts the number over its length; the
// callout and the sheen follow it.
export const thinSlabTimeline = defineTimeline<
  ThinSlabElementId,
  ThinSlabTimingProps
>(({ squeezeDuration = SQUEEZE }): TimelineElement<ThinSlabElementId>[] => {
  const lag = squeezeDuration - SQUEEZE;
  return [
    { id: "wipe", lane: "Frame", label: "wipe in", start: -5, length: 25 },
    { id: "title", lane: "Copy", label: "title", start: -4, length: 18 },
    { id: "number", lane: "Number", label: "number", start: 3, length: 19 },
    { id: "ghost", lane: "Slab", label: "ghost", start: 40, length: 12 },
    { id: "labels", lane: "Copy", label: "label swap", start: 42, length: 14 },
    {
      id: "squeeze",
      lane: "Slab",
      label: "squeeze",
      start: 46,
      length: squeezeDuration,
    },
    {
      id: "callout",
      lane: "Number",
      label: "callout",
      start: 70 + lag,
      length: 18,
      follows: "squeeze",
    },
    {
      id: "sheen",
      lane: "Slab",
      label: "sheen",
      start: 84 + lag,
      length: 24,
      follows: "squeeze",
    },
  ];
});
