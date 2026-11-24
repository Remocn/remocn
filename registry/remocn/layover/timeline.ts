import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The first line rising word by word, then its last word lifting off and
// hopping stop to stop down to the second line, picking up a piece at each
// stop, while the second line's first word rises to meet it. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. The ids are public: a
// saved `timing` prop refers to them.

export type LayoverElementId =
  | `word:${number}`
  | "lift"
  | `leg:${number}`
  | `stop:${number}`
  | "to"
  | "land";

export interface LayoverTimingProps {
  from?: string;
  word?: string;
  stops?: string[];
  /** Frames for each hop of the word between stops. */
  leg?: number;
  /** Frames the word holds at each stop. */
  hold?: number;
}

export const DEFAULT_STOPS = ["w", "every"];
const A_IN = 0;
const WORD_STAGGER = 3;
/** A word of the first line rises over `RISE`. */
const RISE = 16;
/** The word lifts off over `LIFT_IN`, `LIFT_LEAD` before its first hop. */
const LIFT = 26;
const LIFT_LEAD = 6;
const LIFT_IN = 10;
const LEG = 22;
const HOLD = 20;
/** A stop's piece boards `BOARD_AT` after the word arrives, over `BOARD`. */
const BOARD_AT = 2;
const BOARD = 11;
/** The second line's word rises `TO_LEAD` before the last hop. */
const TO_LEAD = 4;
/** The word drops back over `DROP` before it lands and settles over `SETTLE`. */
const DROP = 8;
const SETTLE = 10;

// `leg:<k>` is the hop to stop `k` (the last one, `leg:<stops>`, lands the
// word on the second line); each leg follows the one before. `stop:<k>` is
// that stop's piece boarding. `land` drops the word onto the line and ends
// on the touch, which then settles over `settle`.
export const layoverTimeline = defineTimeline<
  LayoverElementId,
  LayoverTimingProps
>(
  ({
    from = "Write it",
    word = "here.",
    stops = DEFAULT_STOPS,
    leg = LEG,
    hold = HOLD,
  }) => {
    const fromWords = from.split(" ").filter(Boolean);
    const wordsA = [...fromWords, word];
    const n = stops.length;
    const legStart = (k: number) => LIFT + k * (leg + hold);
    const arriveAt = (k: number) => legStart(k) + leg;
    const landAt = arriveAt(n);

    const elements: TimelineElement<LayoverElementId>[] = wordsA.map(
      (wd, i) => ({
        id: `word:${i}`,
        lane: "First line",
        label: wd,
        start: A_IN + i * WORD_STAGGER,
        length: RISE,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    elements.push({
      id: "lift",
      lane: "Word",
      label: "lift off",
      start: LIFT - LIFT_LEAD,
      length: LIFT_IN,
    });
    for (let k = 0; k <= n; k++) {
      elements.push({
        id: `leg:${k}`,
        lane: "Word",
        label: k < n ? `to ${stops[k]}` : "to the line",
        start: legStart(k),
        length: leg,
        follows: k > 0 ? `leg:${k - 1}` : "lift",
      });
      if (k < n) {
        elements.push({
          id: `stop:${k}`,
          lane: "Stops",
          label: stops[k],
          start: arriveAt(k) + BOARD_AT,
          length: BOARD,
          follows: `leg:${k}`,
        });
      }
    }
    elements.push(
      {
        id: "to",
        lane: "Second line",
        label: "second line",
        start: legStart(n) - TO_LEAD,
        length: RISE,
        follows: n > 0 ? `leg:${n - 1}` : undefined,
      },
      {
        id: "land",
        lane: "Word",
        label: "land",
        start: landAt - DROP,
        length: DROP,
        follows: `leg:${n}`,
        beats: { settle: SETTLE },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
