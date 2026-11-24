import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A chip pops in and unfurls into a toolbar, the cursor clicks the selection
// disc from tool to tool with a caption per tool, then the toolbar retracts
// into a text caret and the final line rises. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type ToolbarUnfurlElementId =
  | "pop"
  | "cursor"
  | "push"
  | `unfurl:${number}`
  | "disc"
  | `hop:${number}`
  | "retract"
  | "caption"
  | "punch";

export interface ToolbarUnfurlTimingProps {
  lines?: string[];
  finalLine?: string;
}

export const DEFAULT_LINES = [
  "Leave a note.",
  "Sketch the shot.",
  "Type on the frame.",
  "Select any layer.",
];
export const DEFAULT_FINAL_LINE = "Every tool, one tap away.";
/** Length of the scene the slow push runs over. */
export const TOOLBAR_UNFURL_END = 150;

/** The chip springs in before the scene starts: frame 0 already moves. */
const POP = -8;
const POP_FADE = 6;
const CURSOR_IN = -4;
const CURSOR_FADE = 6;
const UNFURL = [6, 10, 14];
const DISC = 18;
const HOPS = [42, 62, 78];
const RETRACT = 94;
const CAPTION = 100;
const PUNCH = 106;
/** Settling time of the chip, tile and heavy springs. */
const CHIP_SETTLE = 14;
const TILE_SETTLE = 16;
const HEAVY_SETTLE = 21;

// `pop` springs the chip in and fades it over `fade`; `cursor` fades the
// cursor in. `unfurl:<i>` slides tool `i` out of the chip; a chain.
// `disc` drops the selection disc on the last tool, and `hop:<i>` moves it
// one tool over: each is clicked at its start, the cursor arrives `reach`
// before and leaves `leave` after, its caption rises `captionAt` after the
// click over `caption`, and the previous caption leaves over `out`. They run
// until the next one; a chain. `retract` folds the toolbar into the caret:
// the last caption leaves over `out`, the group lifts from `lift`, the cursor
// fades from `fadeAt` over `fade` and glides off by `cursorAt`, and the caret
// draws in from `caretAt` over `caret`. `caption` raises the final line,
// `punch` bumps the disc and caret. `push` is the slow push over the scene.
export const toolbarUnfurlTimeline = defineTimeline<
  ToolbarUnfurlElementId,
  ToolbarUnfurlTimingProps
>(({ lines = DEFAULT_LINES, finalLine = DEFAULT_FINAL_LINE }) => {
  const steps = [DISC, ...HOPS];
  const step = (i: number): TimelineElement<ToolbarUnfurlElementId> => ({
    id: i === 0 ? "disc" : `hop:${i - 1}`,
    lane: "Disc",
    label: lines[i] ?? "",
    start: steps[i],
    length: (steps[i + 1] ?? RETRACT) - steps[i],
    follows:
      i === 0
        ? `unfurl:${UNFURL.length - 1}`
        : i === 1
          ? "disc"
          : `hop:${i - 2}`,
    beats: {
      reach: i === 0 ? -4 : -5,
      leave: 2,
      captionAt: i === 0 ? 0 : 3,
      caption: 12,
      out: 7,
    },
  });
  const elements: TimelineElement<ToolbarUnfurlElementId>[] = [
    {
      id: "pop",
      lane: "Toolbar",
      label: "Pop",
      start: POP,
      length: CHIP_SETTLE,
      beats: { fade: POP_FADE },
    },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor in",
      start: CURSOR_IN,
      length: CURSOR_FADE,
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push",
      start: 0,
      length: TOOLBAR_UNFURL_END,
    },
    ...UNFURL.map(
      (at, i): TimelineElement<ToolbarUnfurlElementId> => ({
        id: `unfurl:${i}`,
        lane: "Tools",
        label: `Tool ${i + 1}`,
        start: at,
        length: TILE_SETTLE,
        follows: i > 0 ? `unfurl:${i - 1}` : undefined,
      }),
    ),
    ...steps.map((_, i) => step(i)),
    {
      id: "retract",
      lane: "Toolbar",
      label: "Retract",
      start: RETRACT,
      length: HEAVY_SETTLE,
      follows: `hop:${HOPS.length - 1}`,
      beats: {
        out: 7,
        lift: 2,
        fadeAt: 4,
        fade: 10,
        caretAt: 8,
        caret: 12,
        cursorAt: 14,
      },
    },
    {
      id: "caption",
      lane: "Caption",
      label: finalLine,
      start: CAPTION,
      length: 14,
      follows: "retract",
    },
    {
      id: "punch",
      lane: "Toolbar",
      label: "Punch",
      start: PUNCH,
      length: CHIP_SETTLE,
      follows: "caption",
    },
  ];
  return elements;
});
