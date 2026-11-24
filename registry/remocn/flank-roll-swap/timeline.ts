import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The card popping in, the slow push on the scene, the words sliding out
// from behind the card on each side, the photo cuts quickening, and the
// words on each side rolling letter by letter into the new ones. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type FlankRollSwapElementId =
  | "push"
  | "card"
  | "leftIn"
  | "rightIn"
  | "cuts"
  | "leftRoll"
  | "rightRoll";

export interface FlankRollSwapTimingProps {
  from?: [string, string];
  to?: [string, string];
  swapAt?: number;
  stagger?: number;
}

export const BEAT = {
  leftIn: 6,
  rightIn: 9,
  slide: 15,
  leftRoll: 48,
  rightGap: 6,
  stagger: 1.2,
  roll: 9,
  accentLag: 3,
  hold: 42,
  fastFrom: 42,
};

export const DEFAULT_SOURCE: [string, string] = ["Remocn", "Studio"];
export const DEFAULT_TARGET: [string, string] = ["Out now", "on remocn.dev"];

/** The card's spring, roughly settled. */
const CARD_POP = 20;
/** The new word starts rolling this long after the old one. */
const NEW_LAG = 1;
/** The accent word colours in over this long once its side has landed. */
const ACCENT_IN = 9;
const PUNCH_PEAK = 2;
const PUNCH_DONE = 7;

/** When a side's roll has landed: its last letter has rolled. */
export const rollEnd = (
  start: number,
  a: string,
  b: string,
  stagger: number = BEAT.stagger,
  roll: number = BEAT.roll,
) => start + Math.max(a.length, b.length) * stagger + roll;

// `leftRoll` and `rightRoll` roll a side's letters, `stagger` apart, each
// over `roll`; the new word follows `newLag` behind the old, and the accent
// colours in over `accent` once the side has landed. The left roll punches
// the card (`punchPeak`, `punchDone`). `cuts` is the quick run of photo cuts,
// from its start until the rolls have landed. `push` runs from the first
// frame until the hold after the rolls, less 12 frames.
export const flankRollSwapTimeline = defineTimeline<
  FlankRollSwapElementId,
  FlankRollSwapTimingProps
>(
  ({
    from = DEFAULT_SOURCE,
    to = DEFAULT_TARGET,
    swapAt = BEAT.leftRoll,
    stagger = BEAT.stagger,
  }) => {
    const leftStart = swapAt;
    const rightStart = swapAt + BEAT.rightGap;
    const leftEnd = rollEnd(leftStart, from[0], to[0], stagger);
    const rightEnd = rollEnd(rightStart, from[1], to[1], stagger);
    const swapEnd = Math.max(leftEnd, rightEnd);
    const rollBeats = { stagger, roll: BEAT.roll, newLag: NEW_LAG };
    const elements: TimelineElement<FlankRollSwapElementId>[] = [
      {
        id: "push",
        lane: "Camera",
        label: "push",
        start: 0,
        length: swapEnd + BEAT.hold - 12,
      },
      { id: "card", lane: "Card", label: "card", start: 0, length: CARD_POP },
      {
        id: "leftIn",
        lane: "Left",
        label: from[0],
        start: BEAT.leftIn,
        length: BEAT.slide,
      },
      {
        id: "rightIn",
        lane: "Right",
        label: from[1],
        start: BEAT.rightIn,
        length: BEAT.slide,
      },
      {
        id: "cuts",
        lane: "Card",
        label: "quick cuts",
        start: BEAT.fastFrom,
        length: Math.max(0, swapEnd - BEAT.fastFrom),
      },
      {
        id: "leftRoll",
        lane: "Left",
        label: to[0],
        start: leftStart,
        length: leftEnd - leftStart,
        beats: {
          ...rollBeats,
          accent: ACCENT_IN,
          punchPeak: PUNCH_PEAK,
          punchDone: PUNCH_DONE,
        },
      },
      {
        id: "rightRoll",
        lane: "Right",
        label: to[1],
        start: rightStart,
        length: rightEnd - rightStart,
        beats: { ...rollBeats, accent: ACCENT_IN },
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
