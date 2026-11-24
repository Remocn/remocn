import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A macro shot of the Publish button: the camera pans along the toolbar, the
// cursor glides in, hovers and clicks, the button spins and turns live, the
// URL lands, then the camera pulls back to the whole window, the title
// rises and the toast pops. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type MacroClickElementId =
  | "pan"
  | "cursor"
  | "hover"
  | "press"
  | "busy"
  | "live"
  | "url"
  | "pull"
  | "title"
  | "toast";

/** The scene's timing does not depend on its props. */
export type MacroClickTimingProps = object;

const END = 150;
const PULL = 72;
const PULL_LEN = 36;

// `pan` slides the macro camera along the toolbar over its length; the
// camera creeps in from its start until the pull. `cursor` glides the cursor
// onto the button over its length, fading in over `fade`. `hover` lights the
// button. `press` dips it, springing back at `release`. `busy` fades the
// spinner in over `fade`. `live` turns the button live, fading the spinner
// out over `fade`; the cursor drifts off from `drift` over `driftLen`. `url`
// lands the URL. `pull` pulls the camera back over its length, settling at
// `settle`, then breathes in for `breath`; the cursor fades from `cursorOut`
// over `cursorOutLen`. `title` rises the title, `toast` pops the toast.
export const macroClickTimeline = defineTimeline<
  MacroClickElementId,
  MacroClickTimingProps
>((): TimelineElement<MacroClickElementId>[] => [
  { id: "pan", lane: "Camera", label: "Pan", start: 0, length: 34 },
  {
    id: "cursor",
    lane: "Cursor",
    label: "Cursor",
    start: 6,
    length: 24,
    beats: { fade: 4 },
  },
  {
    id: "hover",
    lane: "Button",
    label: "Hover",
    start: 30 - 3,
    length: 6,
    follows: "cursor",
  },
  {
    id: "press",
    lane: "Button",
    label: "Press",
    start: 36,
    length: 4,
    follows: "hover",
    beats: { release: 4 },
  },
  {
    id: "busy",
    lane: "Button",
    label: "Publishing",
    start: 40,
    length: 20,
    follows: "press",
    beats: { fade: 6 },
  },
  {
    id: "live",
    lane: "Button",
    label: "Live",
    start: 60,
    length: 4,
    follows: "busy",
    beats: { fade: 6, drift: 6, driftLen: 18 },
  },
  {
    id: "url",
    lane: "Button",
    label: "URL",
    start: 64,
    length: 8,
    follows: "live",
  },
  {
    id: "pull",
    lane: "Camera",
    label: "Pull back",
    start: PULL,
    length: PULL_LEN,
    follows: "url",
    beats: {
      settle: 10,
      breath: END - PULL - PULL_LEN,
      cursorOut: 18,
      cursorOutLen: 9,
    },
  },
  {
    id: "title",
    lane: "Title",
    label: "Title",
    start: 84,
    length: 15,
    follows: "pull",
  },
  {
    id: "toast",
    lane: "Title",
    label: "Toast",
    start: 102,
    length: 16,
    follows: "title",
  },
]);
