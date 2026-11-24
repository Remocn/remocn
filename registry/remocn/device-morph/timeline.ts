import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The device rising in with its chrome, the cursor coming on screen and
// travelling to the switcher, and the two clicks that morph the device from
// stop to stop. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type DeviceMorphElementId = "enter" | "approach" | `click:${number}`;

/** The scene's timing does not depend on its props. */
export type DeviceMorphTimingProps = object;

const CLICK_A = 50;
const CLICK_B = 124;
const MORPH = 44;

// `enter` brings the chrome in `chrome` frames after the device. `approach`
// fades the cursor in around its start (`fade`, `fadeLen`). A click's beats:
// the press around it (`pressIn`, `pressOut`), the morph spring after it
// (`morphDelay`, `morph`), and the cursor's path (`arrive` on the chip,
// `hold` there, `away` once parked). The second click also has the cursor
// leaving its park (`leave`) and fading out (`fadeOut`, ending at `away`).
export const deviceMorphTimeline = defineTimeline<
  DeviceMorphElementId,
  DeviceMorphTimingProps
>((): TimelineElement<DeviceMorphElementId>[] => [
  {
    id: "enter",
    lane: "Device",
    label: "device rises in",
    start: 0,
    length: 20,
    beats: { chrome: 6 },
  },
  {
    id: "approach",
    lane: "Cursor",
    label: "cursor to the switcher",
    start: 20,
    length: CLICK_A - 3 - 20,
    beats: { fade: -2, fadeLen: 6 },
  },
  {
    id: "click:0",
    lane: "Switcher",
    label: "first stop",
    start: CLICK_A,
    length: CLICK_B - CLICK_A,
    follows: "approach",
    beats: {
      pressIn: -2,
      pressOut: 2,
      morphDelay: 2,
      morph: MORPH,
      arrive: -3,
      hold: 14,
      away: 34,
    },
  },
  {
    id: "click:1",
    lane: "Switcher",
    label: "second stop",
    start: CLICK_B,
    length: 40,
    follows: "click:0",
    beats: {
      pressIn: -2,
      pressOut: 2,
      morphDelay: 2,
      morph: MORPH,
      leave: -24,
      arrive: -3,
      hold: 14,
      fadeOut: 30,
      away: 40,
    },
  },
]);
