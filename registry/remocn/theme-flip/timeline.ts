import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The window rising in, the camera pushing onto the toggle, the cursor
// travelling to it, the click, the new theme flooding out of the toggle, the
// camera pulling back and the cursor parking. With `reverse`, the same again
// back to the first theme (`back:*`). Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type ThemeFlipElementId =
  | "enter"
  | "push"
  | "approach"
  | "click"
  | "flood"
  | "pull"
  | "park"
  | "back:push"
  | "back:approach"
  | "back:click"
  | "back:flood"
  | "back:pull"
  | "back:park";

export interface ThemeFlipTimingProps {
  reverse?: boolean;
  clickAt?: number;
}

export const CLICK = 36;
const FLOOD = 26;
const REV = 92;

/** Beats of a click on the toggle, from the click frame. */
const CLICK_BEATS = {
  hoverIn: -6,
  hoverInLen: 4,
  hoverOut: 2,
  hoverOutLen: 3,
  knob: 1,
  pressIn: -2,
  pressOut: 2,
};

// `enter` springs from two frames before its start (`lead`). A click's beats
// time the hover, the knob's spring and the press around the click frame.
// The flood, the pull back and the cursor parking follow their click.
export const themeFlipTimeline = defineTimeline<
  ThemeFlipElementId,
  ThemeFlipTimingProps
>(({ reverse = false, clickAt = CLICK }) => {
  const elements: TimelineElement<ThemeFlipElementId>[] = [
    {
      id: "enter",
      lane: "App",
      label: "app rises in",
      start: 0,
      length: 30,
      beats: { lead: 2 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "push onto the toggle",
      start: 2,
      length: 28,
    },
    {
      id: "approach",
      lane: "Cursor",
      label: "cursor to the toggle",
      start: 6,
      length: clickAt - 10,
      beats: { fade: 6 },
    },
    {
      id: "click",
      lane: "Toggle",
      label: "click",
      start: clickAt,
      length: 2,
      follows: "approach",
      beats: CLICK_BEATS,
    },
    {
      id: "flood",
      lane: "Toggle",
      label: "theme floods in",
      start: clickAt + 2,
      length: FLOOD,
      follows: "click",
    },
    {
      id: "pull",
      lane: "Camera",
      label: "pull back",
      start: clickAt + 6,
      length: 32,
      follows: "click",
    },
    {
      id: "park",
      lane: "Cursor",
      label: "cursor parks",
      start: clickAt + 8,
      length: 22,
      follows: "click",
    },
  ];
  if (reverse) {
    const REV_CLICK = REV + 24;
    elements.push(
      {
        id: "back:push",
        lane: "Camera",
        label: "push onto the toggle",
        start: REV,
        length: 22,
      },
      {
        id: "back:approach",
        lane: "Cursor",
        label: "cursor to the toggle",
        start: REV + 2,
        length: 18,
      },
      {
        id: "back:click",
        lane: "Toggle",
        label: "click back",
        start: REV_CLICK,
        length: 2,
        follows: "back:approach",
        beats: CLICK_BEATS,
      },
      {
        id: "back:flood",
        lane: "Toggle",
        label: "first theme floods back",
        start: REV_CLICK + 2,
        length: FLOOD,
        follows: "back:click",
      },
      {
        id: "back:pull",
        lane: "Camera",
        label: "pull back",
        start: REV_CLICK + 6,
        length: 32,
        follows: "back:click",
      },
      {
        id: "back:park",
        lane: "Cursor",
        label: "cursor parks",
        start: REV_CLICK + 8,
        length: 22,
        follows: "back:click",
      },
    );
  }
  return elements.sort((a, b) => a.start - b.start);
});
