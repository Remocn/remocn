import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The clock dropping in, the whole seconds ticking down, the red tenths, the
// buzzer, the clock shrinking away and the title and subtitle slamming in.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids
// are public: a saved `timing` prop refers to them.

export type ShotClockElementId =
  | "drop"
  | "seconds"
  | "tenths"
  | "buzzer"
  | "shrink"
  | "title"
  | "subtitle";

export interface ShotClockTimingProps {
  from?: number;
  tenthsBelow?: number;
  tick?: number;
  hold?: number;
}

/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 2;
const DROP_AT = 0;
const TICK_AT = 14;
const TICK = 2.6;
const TENTH = 1;
const SHRINK_DELAY = 6;
const SHRINK_LEN = 11;

/** The whole seconds the clock starts from. */
export function clockStart(from: number, tenthsBelow: number) {
  return Math.max(tenthsBelow + 1, Math.floor(from));
}

// `drop` brings the clock in; the light and the bar draw from `draw` over
// `drawLen`, the labels fade up from `labels` over `labelsLen`. `seconds`
// ticks a whole second every `tick`; `tenths` turns the clock red with a
// `kick` and counts a tenth every `tenth`; `buzzer` is the 0.0, flashing
// the frame (`flash`), kicking the clock and lifting the glow (`ground`),
// held for its length. Then `shrink`, `title` (with a `kick` at `kickAt`)
// and `subtitle`. Each follows the one before.
export const shotClockTimeline = defineTimeline<
  ShotClockElementId,
  ShotClockTimingProps
>(
  ({
    from = 24,
    tenthsBelow = 5,
    tick = TICK,
    hold = SHRINK_DELAY,
  }): TimelineElement<ShotClockElementId>[] => {
    const start = clockStart(from, tenthsBelow);
    const wholeTicks = start - tenthsBelow;
    const redAt = TICK_AT + wholeTicks * tick;
    const buzzAt = redAt + tenthsBelow * 10 * TENTH;
    const shrinkAt = buzzAt + hold;
    const titleAt = buzzAt + hold + SHRINK_LEN - 4;
    return [
      {
        id: "drop",
        lane: "Clock",
        label: "drop in",
        start: DROP_AT - PREROLL,
        length: 9,
        beats: { draw: 2, drawLen: 12, labels: 5, labelsLen: 8 },
      },
      {
        id: "seconds",
        lane: "Clock",
        label: "seconds",
        start: TICK_AT - PREROLL,
        length: redAt - TICK_AT,
        follows: "drop",
        beats: { tick },
      },
      {
        id: "tenths",
        lane: "Clock",
        label: "tenths",
        start: redAt - PREROLL,
        length: buzzAt - redAt,
        follows: "seconds",
        beats: { tenth: TENTH, kick: 8 },
      },
      {
        id: "buzzer",
        lane: "Clock",
        label: "buzzer",
        start: buzzAt - PREROLL,
        length: hold,
        follows: "tenths",
        beats: { flash: 9, kick: 10, ground: 6 },
      },
      {
        id: "shrink",
        lane: "Clock",
        label: "shrink",
        start: shrinkAt - PREROLL,
        length: SHRINK_LEN,
        follows: "buzzer",
      },
      {
        id: "title",
        lane: "Title",
        label: "title",
        start: titleAt - PREROLL,
        length: 7,
        follows: "shrink",
        beats: { kickAt: 3, kick: 8 },
      },
      {
        id: "subtitle",
        lane: "Title",
        label: "subtitle",
        start: titleAt + 4 - PREROLL,
        length: 9,
        follows: "title",
      },
    ];
  },
);
