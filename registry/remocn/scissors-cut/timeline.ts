import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line fading in letter by letter, its neighbours stepping aside, the
// cut line dashing round the words, the scissors flying in, cutting once
// round and pulling away, the cut slip lifting and falling, the line closing
// up, the replacement rising into the gap and the room closing. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type ScissorsCutElementId =
  | "enter"
  | "room"
  | "dash"
  | "scissorsIn"
  | "cut"
  | "scissorsOut"
  | "lift"
  | "reflow"
  | "replacement"
  | "close";

export interface ScissorsCutTimingProps {
  before?: string;
  cut?: string;
  after?: string;
  replacement?: string;
  stagger?: number;
}

export const DEFAULT_BEFORE = "Launch ";
export const DEFAULT_CUT = "next month";
export const DEFAULT_AFTER = ".";
export const DEFAULT_REPLACEMENT = "today";
export const IN_STAGGER = 1.5;

const IN = 0;
const IN_LEN = 18;
const ROOM = 14;
const ROOM_LEN = 20;
const DASH = 24;
const DASH_LEN = 24;
const SC_IN = 30;
const SC_IN_LEN = 24;
const SC_OPEN = 14;
const SC_FADE = 8;
const CUT = 56;
const CUT_LEN = 62;
const SC_OUT = 120;
const SC_OUT_LEN = 22;
const LIFT = 120;
const LIFT_LEN = 8;
const FALL_AT = LIFT_LEN - 2;
const FALL_LEN = 26;
const SLOT_IN = 4;
const REFLOW = 142;
const REFLOW_LEN = 22;
const REPL = 152;
const REPL_STAGGER = 2;
const REPL_LEN = 24;
const SLOT_OUT_AT = 6;
const CLOSE = 180;
const CLOSE_LEN = 22;

// `enter` fades the line in, letters `stagger` apart, each over `rise`.
// `scissorsIn` opens the blades over `open` and fades them in over `fade`.
// `lift` raises the cut slip; it falls from `fallAt` over `fall`, and the
// slot it leaves shows over `slot`. `replacement` rises letter by letter
// (`stagger` apart, each over `rise`), and the slot fades from `slotOutAt`
// until the first letter has risen. Each element follows the one before;
// the slip lifts as the scissors leave.
export const scissorsCutTimeline = defineTimeline<
  ScissorsCutElementId,
  ScissorsCutTimingProps
>(
  ({
    before = DEFAULT_BEFORE,
    cut = DEFAULT_CUT,
    after = DEFAULT_AFTER,
    replacement = DEFAULT_REPLACEMENT,
    stagger = IN_STAGGER,
  }): TimelineElement<ScissorsCutElementId>[] => {
    const letters = Array.from(before + cut + after).length;
    const repl = Array.from(replacement).length;
    return [
      {
        id: "enter",
        lane: "Line",
        label: before + cut + after,
        start: IN,
        length: Math.max(0, letters - 1) * stagger + IN_LEN,
        beats: { stagger, rise: IN_LEN },
      },
      {
        id: "room",
        lane: "Line",
        label: "make room",
        start: ROOM,
        length: ROOM_LEN,
        follows: "enter",
      },
      {
        id: "dash",
        lane: "Cut line",
        label: "dash",
        start: DASH,
        length: DASH_LEN,
        follows: "room",
      },
      {
        id: "scissorsIn",
        lane: "Scissors",
        label: "scissors in",
        start: SC_IN,
        length: SC_IN_LEN,
        follows: "dash",
        beats: { open: SC_OPEN, fade: SC_FADE },
      },
      {
        id: "cut",
        lane: "Scissors",
        label: cut,
        start: CUT,
        length: CUT_LEN,
        follows: "scissorsIn",
      },
      {
        id: "scissorsOut",
        lane: "Scissors",
        label: "scissors out",
        start: SC_OUT,
        length: SC_OUT_LEN,
        follows: "cut",
      },
      {
        id: "lift",
        lane: "Cut line",
        label: "slip falls",
        start: LIFT,
        length: LIFT_LEN,
        follows: "cut",
        beats: { fallAt: FALL_AT, fall: FALL_LEN, slot: SLOT_IN },
      },
      {
        id: "reflow",
        lane: "Line",
        label: "close up",
        start: REFLOW,
        length: REFLOW_LEN,
        follows: "lift",
      },
      {
        id: "replacement",
        lane: "Replacement",
        label: replacement,
        start: REPL,
        length: Math.max(0, repl - 1) * REPL_STAGGER + REPL_LEN,
        follows: "reflow",
        beats: {
          stagger: REPL_STAGGER,
          rise: REPL_LEN,
          slotOutAt: SLOT_OUT_AT,
        },
      },
      {
        id: "close",
        lane: "Line",
        label: "close room",
        start: CLOSE,
        length: CLOSE_LEN,
        follows: "replacement",
      },
    ];
  },
);
