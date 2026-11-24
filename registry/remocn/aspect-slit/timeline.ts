import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The letterbox bars closing to scope and then to a slit, the title rising
// into the slit and pushing in slowly while it holds, the bars opening back
// to full frame as the title grows to hero size, and the caption settling.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type AspectSlitElementId =
  | "scope"
  | "slit"
  | "rise"
  | "push"
  | "open"
  | "grow"
  | "caption";

// Beat sheet (30fps):
//  0–24    letterbox bars close from 16:9 to 2.39:1 (already moving on frame 0)
//  24–32   a beat on scope
//  32–64   the bars keep closing to a thin slit
//  50–74   the title rises into the slit from behind the lower bar; holds,
//          tracking tightening, to 98
//  98–138  bars open back to full frame; the title grows to hero size, never
//          taller than the opening
//  128–150 caption settles under the title; poster hold to 180
const SCOPE_AT = -6;
const SCOPE_END = 24;
const SLIT_AT = 32;
const SLIT_END = 64;
const RISE_AT = 50;
const RISE_END = 74;
const PUSH_AT = RISE_END - 6;
const OPEN_AT = 98;
const OPEN_END = 138;
const PUSH_END = OPEN_AT + 4;
const GROW_AT = 102;
const GROW_END = 146;
const CAPTION_AT = 128;
const CAPTION_END = 150;

// The scope close starts before the first frame, so it is already moving on
// frame 0. The slit follows the scope and the title's rise follows the slit;
// the push follows the rise, the opening follows the rise, and the growth and
// the caption follow the opening. The title's tracking tightens from the
// rise's start through the opening's start to the growth's end.
export const aspectSlitTimeline = defineTimeline<AspectSlitElementId, object>(
  (): TimelineElement<AspectSlitElementId>[] => [
    {
      id: "scope",
      lane: "Bars",
      label: "close to scope",
      start: SCOPE_AT,
      length: SCOPE_END - SCOPE_AT,
    },
    {
      id: "slit",
      lane: "Bars",
      label: "close to slit",
      start: SLIT_AT,
      length: SLIT_END - SLIT_AT,
      follows: "scope",
    },
    {
      id: "rise",
      lane: "Title",
      label: "rise",
      start: RISE_AT,
      length: RISE_END - RISE_AT,
      follows: "slit",
    },
    {
      id: "push",
      lane: "Push",
      label: "push in",
      start: PUSH_AT,
      length: PUSH_END - PUSH_AT,
      follows: "rise",
    },
    {
      id: "open",
      lane: "Bars",
      label: "open",
      start: OPEN_AT,
      length: OPEN_END - OPEN_AT,
      follows: "rise",
    },
    {
      id: "grow",
      lane: "Title",
      label: "grow",
      start: GROW_AT,
      length: GROW_END - GROW_AT,
      follows: "open",
    },
    {
      id: "caption",
      lane: "Caption",
      label: "caption",
      start: CAPTION_AT,
      length: CAPTION_END - CAPTION_AT,
      follows: "open",
    },
  ],
);
