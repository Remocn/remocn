import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The scattered letters fading in, the magnet gliding in and sweeping the
// line (each letter snaps into place as it passes), returning to the wrong
// word, flipping and repelling it, the line reflowing while the magnet flips
// back, the right word's letters dropping in one by one, and the magnet
// gliding off. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type MagnetLettersElementId =
  | "scatter"
  | "enter"
  | "sweep"
  | "return"
  | "flip"
  | "repel"
  | "reflow"
  | "unflip"
  | `drop:${number}`
  | "exit";

export interface MagnetLettersTimingProps {
  word?: string;
  stagger?: number;
}

export const DEFAULT_WORD = "videos";
export const DROP_STAGGER = 4;

const IN = 0;
const MAG_IN = 10;
const SWEEP = 32;
const SWEEP_END = 90;
const RETURN = 98;
const RETURN_END = 118;
const FLIP = 120;
const FLIP_LEN = 9;
const REPEL = 128;
const REPEL_LEN = 24;
const REFLOW = 136;
const REFLOW_LEN = 20;
const FLIP_BACK = 142;
const DROP = 152;
const FALL = 11;
const EXIT = 190;
const EXIT_LEN = 26;
const SNAP = 8;

// The scattered letters fade in over `fade` frames, spread over `spread`.
// During the sweep a letter lands `land` frames after the magnet passes
// under it, leaning in over `lean` frames and snapping over `snap`. The
// repel lifts each wrong letter for `letter` frames, the outer ones up to
// `spread` later. `drop:<k>` is letter `k` of the right word falling in, a
// chain. The magnet's moves follow one another; the exit follows the last
// letter dropping in.
export const magnetLettersTimeline = defineTimeline<
  MagnetLettersElementId,
  MagnetLettersTimingProps
>(({ word = DEFAULT_WORD, stagger = DROP_STAGGER }) => {
  const right = Array.from(word);
  const lastDrop = DROP + (right.length - 1) * stagger;
  const elements: TimelineElement<MagnetLettersElementId>[] = [
    {
      id: "scatter",
      lane: "Letters",
      label: "letters fade in",
      start: IN,
      length: 14 + 16,
      beats: { spread: 14, fade: 16 },
    },
    {
      id: "enter",
      lane: "Magnet",
      label: "glide in",
      start: MAG_IN,
      length: SWEEP - MAG_IN,
    },
    {
      id: "sweep",
      lane: "Magnet",
      label: "sweep",
      start: SWEEP,
      length: SWEEP_END - SWEEP,
      follows: "enter",
      beats: { land: 2, snap: SNAP, lean: 10 },
    },
    {
      id: "return",
      lane: "Magnet",
      label: "return",
      start: RETURN,
      length: RETURN_END - RETURN,
      follows: "sweep",
    },
    {
      id: "flip",
      lane: "Flip",
      label: "flip",
      start: FLIP,
      length: FLIP_LEN,
      follows: "return",
    },
    {
      id: "repel",
      lane: "Letters",
      label: "repel",
      start: REPEL,
      length: REPEL_LEN + 2,
      follows: "flip",
      beats: { spread: 4, letter: REPEL_LEN },
    },
    {
      id: "reflow",
      lane: "Magnet",
      label: "reflow",
      start: REFLOW,
      length: REFLOW_LEN,
      follows: "repel",
    },
    {
      id: "unflip",
      lane: "Flip",
      label: "flip back",
      start: FLIP_BACK,
      length: FLIP_LEN,
      follows: "reflow",
    },
    ...right.map(
      (ch, k): TimelineElement<MagnetLettersElementId> => ({
        id: `drop:${k}`,
        lane: "Word",
        label: ch,
        start: DROP + k * stagger,
        length: FALL,
        follows: k > 0 ? `drop:${k - 1}` : "reflow",
      }),
    ),
    {
      id: "exit",
      lane: "Magnet",
      label: "glide off",
      start: EXIT,
      length: EXIT_LEN,
      follows:
        right.length > 0 && lastDrop <= EXIT
          ? `drop:${right.length - 1}`
          : "reflow",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
