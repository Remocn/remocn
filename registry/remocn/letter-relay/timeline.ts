import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The floor light fading up, each letter rising into place, the relay of hops
// (each letter takes off as the one before lands) and the word settling from
// loose to tight spacing. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type LetterRelayElementId =
  | "floor"
  | `enter:${number}`
  | `hop:${number}`
  | "settle";

export interface LetterRelayTimingProps {
  word?: string;
  /** Frames per hop; the next letter takes off as the previous one lands. */
  hop?: number;
}

export const DEFAULT_WORD = "remocn";
export const DEFAULT_HOP = 10;

const POOL_IN = 24;
const ENTER_STAGGER = 2;
const ENTER = 14;
const HOP_AT = 20;
/** The letter crouches this long before take-off. */
const CROUCH = 3;
/** The accent arrives over `TAKE` either side of take-off. */
const TAKE = 2;
/** The accent hands over from `GIVE` before landing to `PASS` after it. */
const GIVE = 1;
const PASS = 5;
/** The spacing closes from `CLOSE_AT` to `CLOSE_END` after the last landing. */
const CLOSE_AT = 1;
const CLOSE_END = 19;
/** The floor light drifts back to centre over `DRIFT` after the last landing. */
const DRIFT = 30;

// `floor` fades the light pool in. `enter:<i>` rises letter `i` into place,
// each following the one before. `hop:<i>` is letter `i` in the air, its
// `crouch`, `take`, `give` and `pass` beats timing the wind-up and the accent
// handed on; each hop follows the one before. `settle` starts at the last
// landing: the pool drifts back over its length, the spacing closes between
// its `close` and `closed` beats.
export const letterRelayTimeline = defineTimeline<
  LetterRelayElementId,
  LetterRelayTimingProps
>(({ word = DEFAULT_WORD, hop = DEFAULT_HOP }) => {
  const chars = Array.from(word);
  const n = chars.length;
  const lastLand = HOP_AT + n * hop;
  const elements: TimelineElement<LetterRelayElementId>[] = [
    {
      id: "floor",
      lane: "Floor",
      label: "floor light",
      start: 0,
      length: POOL_IN,
    },
    ...chars.map(
      (ch, i): TimelineElement<LetterRelayElementId> => ({
        id: `enter:${i}`,
        lane: "Enter",
        label: ch,
        start: i * ENTER_STAGGER,
        length: ENTER,
        follows: i > 0 ? `enter:${i - 1}` : undefined,
      }),
    ),
    ...chars.map(
      (ch, i): TimelineElement<LetterRelayElementId> => ({
        id: `hop:${i}`,
        lane: "Hops",
        label: ch,
        start: HOP_AT + i * hop,
        length: hop,
        follows: i > 0 ? `hop:${i - 1}` : undefined,
        beats: { crouch: CROUCH, take: TAKE, give: GIVE, pass: PASS },
      }),
    ),
    {
      id: "settle",
      lane: "Word",
      label: "settle",
      start: lastLand,
      length: DRIFT,
      follows: n > 0 ? `hop:${n - 1}` : undefined,
      beats: { close: CLOSE_AT, closed: CLOSE_END },
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
