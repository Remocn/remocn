import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in and erasing as it slides away, the rim stroke drawing
// the card's edge with its tail chasing it, the card body, its items one
// after another, the typing, the button press and the saved state, and the
// slow camera pan and push. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type RimDrawCardElementId =
  | "line"
  | "stroke"
  | "slide"
  | "erase"
  | "chip"
  | "tail"
  | "body"
  | "camera"
  | "title"
  | "field"
  | "footer"
  | "type"
  | "chips"
  | "preview"
  | "press"
  | "saved";

export interface RimDrawCardTimingProps {
  line?: string;
  instructions?: string;
  uses?: string[];
  typeRate?: number;
}

export const DEFAULT_LINE = "Just tell it once.";
export const DEFAULT_INSTRUCTIONS =
  "Short, calm sentences. Name the feature first, then what it saves you.";
export const DEFAULT_USES = ["Launch posts", "Changelog", "Release emails"];

const WORDS = -8;
/** Each letter of the line rises over this many frames, three at a time. */
const LETTER_RISE = 14;
const STROKE = 18;
const STROKE_LEN = 30;
const ERASE = 20;
/** Frames between one letter erasing and the one before it. */
const ERASE_STAGGER = 0.72;
const ERASE_FADE = 7;
const SLIDE = 18;
const CHIP = 24;
const TAIL = 32;
const TAIL_LEN = 16;
const BODY = 36;
const PAN = 36;
const TITLE = 42;
const FIELD = 48;
const FOOTER = 54;
const TYPE = 60;
const CHIPS = 66;
const PREVIEW = 78;
const PRESS = 96;
const SAVED = 99;
/** The camera push ends here: the scene's natural length. */
export const RIM_DRAW_END = 138;
/** Each card item fades up over this many frames. */
const ITEM = 12;

// The card items (`title`, `field`, `footer`, `chips`, `preview`) each rise
// over their `item` beat; a second item in the same row starts at
// `second`. `type` runs as long as the instructions take to type; the
// press follows it and the saved state follows the press.
export const rimDrawCardTimeline = defineTimeline<
  RimDrawCardElementId,
  RimDrawCardTimingProps
>(
  ({
    line = DEFAULT_LINE,
    instructions = DEFAULT_INSTRUCTIONS,
    uses = DEFAULT_USES,
    typeRate = 2.2,
  }): TimelineElement<RimDrawCardElementId>[] => {
    const n = Array.from(line).length;
    return [
      {
        id: "line",
        lane: "Line",
        label: "Line rises in",
        start: WORDS,
        length: Math.floor((n - 1) / 3) + LETTER_RISE,
        beats: { rise: LETTER_RISE },
      },
      {
        id: "stroke",
        lane: "Rim",
        label: "Rim draws",
        start: STROKE,
        length: STROKE_LEN,
        beats: { drawn: STROKE_LEN - 6, drawnLen: 6 },
      },
      {
        id: "slide",
        lane: "Line",
        label: "Line slides away",
        start: SLIDE,
        length: ERASE - SLIDE,
        follows: "line",
      },
      {
        id: "erase",
        lane: "Line",
        label: "Line erases",
        start: ERASE,
        length: Math.max(0, n - 1) * ERASE_STAGGER + ERASE_FADE,
        follows: "slide",
        beats: { stagger: ERASE_STAGGER, fade: ERASE_FADE },
      },
      {
        id: "chip",
        lane: "Card",
        label: "Command chip",
        start: CHIP,
        length: BODY - CHIP,
        beats: { hot: 6, fade: 4 },
      },
      {
        id: "tail",
        lane: "Rim",
        label: "Tail catches up",
        start: TAIL,
        length: TAIL_LEN,
        follows: "stroke",
      },
      {
        id: "body",
        lane: "Card",
        label: "Card body",
        start: BODY,
        length: TITLE - BODY,
        follows: "chip",
        beats: {
          fill: 12,
          brighten: -4,
          brightenLen: 24,
          settle: 6,
          settleLen: 24,
        },
      },
      {
        id: "camera",
        lane: "Camera",
        label: "Pan and push",
        start: PAN,
        length: RIM_DRAW_END - PAN,
      },
      {
        id: "title",
        lane: "Card",
        label: "Title",
        start: TITLE,
        length: FIELD - TITLE,
        follows: "body",
        beats: { item: ITEM, second: 3 },
      },
      {
        id: "field",
        lane: "Card",
        label: "Field",
        start: FIELD,
        length: FOOTER - FIELD,
        follows: "title",
        beats: { item: ITEM, second: 2, caret: 6 },
      },
      {
        id: "footer",
        lane: "Card",
        label: "Footer",
        start: FOOTER,
        length: TYPE - FOOTER,
        follows: "field",
        beats: { item: ITEM },
      },
      {
        id: "type",
        lane: "Typing",
        label: "Instructions typed",
        start: TYPE,
        length: instructions.length / typeRate,
        beats: { focus: -6, focusLen: 8 },
      },
      {
        id: "chips",
        lane: "Card",
        label: "Use-for chips",
        start: CHIPS,
        length: Math.max(0, uses.length - 1) * 3 + 4,
        beats: { item: ITEM, label: -4, stagger: 3, fade: 4 },
      },
      {
        id: "preview",
        lane: "Card",
        label: "Preview",
        start: PREVIEW,
        length: 3 + ITEM,
        beats: { item: ITEM, second: 3 },
      },
      {
        id: "press",
        lane: "Button",
        label: "Press",
        start: PRESS,
        length: SAVED - PRESS,
        follows: "type",
        beats: { release: 4, unfocus: 8 },
      },
      {
        id: "saved",
        lane: "Button",
        label: "Saved",
        start: SAVED,
        length: RIM_DRAW_END - SAVED,
        follows: "press",
      },
    ];
  },
);
