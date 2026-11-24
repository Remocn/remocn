import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The cursor coming in, grabbing the word's last letter and pulling it out,
// holding the tension, letting go with a snap, the word swapping for its
// snap word and the accent period landing. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type RubberbandWordElementId =
  | "approach"
  | "pull"
  | "hold"
  | "snap"
  | "swap"
  | "period";

export interface RubberbandWordTimingProps {
  word?: string;
  snapWord?: string;
  period?: boolean;
  hold?: number;
}

export const DEFAULT_WORD = "tension";
export const DEFAULT_SNAP_WORD = "release";

const GRAB = 22;
const DRAG_END = 56;
/** Frames the stretched word holds by default. */
export const HOLD = 8;
const PRESS = 3;
const DRAG = 4;
const PRESS_OUT = 4;
const AWAY_AT = 1;
const AWAY = 26;
const FADE_AT = 8;
const FADE_DONE = 22;
const BAND_OUT = 5;
const FILL = 6;
const DRIFT = 60;
const SWAP_AT = 4;
const LETTER_STAGGER = 0.5;
const INCOMING = 4;
const SQUASH = 5;
const SPRING_IN = 12;
const DOT_AT = 10;
const DOT_IN = 10;

/** The word pulled, and the word it snaps into (itself when none). */
export function wordsOf(word: string, snapWord: string) {
  const from = word.trim() || DEFAULT_WORD;
  const to = snapWord.trim() || from;
  return { from, to, swaps: to !== from };
}

// `approach` is the cursor travelling to the last letter. `pull` starts on
// the grab: the cursor presses over `press` and drags from `drag` to its
// end. `hold` is the stretched word holding, at least a frame. `snap` is the
// release: the press lets go over `pressOut`, the band fades over `bandOut`,
// the cursor leaves from `awayAt` to `away` and fades from `fadeAt` to
// `fadeDone`, the fill takes over at `fill` and drifts over `drift`. `swap`
// squashes the old word out letter by letter (`stagger` apart, each over
// `squash`) and springs the new one in `incoming` later; `period` is the
// accent period. Each element follows the one before.
export const rubberbandWordTimeline = defineTimeline<
  RubberbandWordElementId,
  RubberbandWordTimingProps
>(
  ({
    word = DEFAULT_WORD,
    snapWord = DEFAULT_SNAP_WORD,
    period = true,
    hold = HOLD,
  }) => {
    const { from, to, swaps } = wordsOf(word, snapWord);
    const release = DRAG_END + Math.max(1, hold);
    const swapAt = release + SWAP_AT;
    const elements: TimelineElement<RubberbandWordElementId>[] = [
      {
        id: "approach",
        lane: "Cursor",
        label: "approach",
        start: 0,
        length: GRAB,
      },
      {
        id: "pull",
        lane: "Cursor",
        label: "grab and pull",
        start: GRAB,
        length: DRAG_END - GRAB,
        follows: "approach",
        beats: { press: PRESS, drag: DRAG },
      },
      {
        id: "hold",
        lane: "Cursor",
        label: "hold",
        start: DRAG_END,
        // interpolate() needs a rising range, so the hold is at least a frame.
        length: Math.max(1, hold),
        follows: "pull",
      },
      {
        id: "snap",
        lane: "Cursor",
        label: "snap",
        start: release,
        length: AWAY_AT + AWAY,
        follows: "hold",
        beats: {
          pressOut: PRESS_OUT,
          awayAt: AWAY_AT,
          away: AWAY,
          fadeAt: FADE_AT,
          fadeDone: FADE_DONE,
          bandOut: BAND_OUT,
          fill: FILL,
          drift: DRIFT,
        },
      },
    ];
    if (swaps) {
      elements.push({
        id: "swap",
        lane: "Word",
        label: to,
        start: swapAt,
        length:
          (Math.max(from.length, to.length) - 1) * LETTER_STAGGER +
          INCOMING +
          SPRING_IN,
        follows: "snap",
        beats: { stagger: LETTER_STAGGER, incoming: INCOMING, squash: SQUASH },
      });
    }
    if (period) {
      elements.push({
        id: "period",
        lane: "Word",
        label: ".",
        start: swapAt + DOT_AT,
        length: DOT_IN,
        follows: swaps ? "swap" : "snap",
      });
    }
    return elements;
  },
);
