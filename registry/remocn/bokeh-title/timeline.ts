import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lights drifting and opening up, focus pulling onto the pattern, focus
// racking back off it after the hold, and the title and subtitle resolving
// in front. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type BokehTitleElementId =
  | "drift"
  | "open"
  | "focus"
  | "rack"
  | "title"
  | "subtitle";

export interface BokehTitleTimingProps {
  hold?: number;
}

const T_FOCUS_IN = [34, 66] as const;
const T_FOCUS_OUT = [90, 120] as const;
const T_TITLE = 106;

/** The default `hold`: frames between focus landing and racking back. */
export const DEFAULT_HOLD = T_FOCUS_OUT[0] - T_FOCUS_IN[1];

// The drift runs under the scene, the lights open up at its start. The
// pattern comes into focus (focus), holds for `hold` frames, and focus racks
// back (rack), which the title and subtitle follow.
export const bokehTitleTimeline = defineTimeline<
  BokehTitleElementId,
  BokehTitleTimingProps
>(({ hold = DEFAULT_HOLD }) => {
  const shift = hold - (T_FOCUS_OUT[0] - T_FOCUS_IN[1]);
  const focusOut = [T_FOCUS_OUT[0] + shift, T_FOCUS_OUT[1] + shift];
  const titleAt = T_TITLE + shift;
  const elements: TimelineElement<BokehTitleElementId>[] = [
    { id: "drift", lane: "Lights", label: "drift", start: 0, length: 200 },
    { id: "open", lane: "Lights", label: "lights open", start: 0, length: 14 },
    {
      id: "focus",
      lane: "Focus",
      label: "focus on the pattern",
      start: T_FOCUS_IN[0],
      length: T_FOCUS_IN[1] - T_FOCUS_IN[0],
    },
    {
      id: "rack",
      lane: "Focus",
      label: "rack back",
      start: focusOut[0],
      length: focusOut[1] - focusOut[0],
      follows: "focus",
    },
    {
      id: "title",
      lane: "Title",
      label: "title",
      start: titleAt,
      length: 40,
      follows: "rack",
    },
    {
      id: "subtitle",
      lane: "Title",
      label: "subtitle",
      start: titleAt + 18,
      length: 28,
      follows: "rack",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
