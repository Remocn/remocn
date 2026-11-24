import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Two timers side by side: both columns fade up, both start running, the
// fast one stops while the slow one keeps chasing its total, and when it
// stops too the row rises and the delta lands under it, then holds. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type TimerDuelElementId =
  | `column:${number}`
  | "run"
  | "chase"
  | "stop"
  | "rise"
  | "delta"
  | "hold";

export interface TimerDuelTimingProps {
  beforeLabel?: string;
  afterLabel?: string;
  run?: number;
  chase?: number;
}

const START = 18;
export const RUN = 32;
export const CHASE = 50;
/** The columns fade up `COLUMN_GAP` apart, each over `APPEAR`. */
const COLUMN_GAP = 3;
const APPEAR = 18;
/** A stopped timer's pulse peaks at `pulsePeak` and is gone by `pulse`. */
const PULSE_PEAK = 2;
const FAST_PULSE = 16;
const SLOW_PULSE = 12;
/** The slow timer dims from `freezeAt` to the end of `stop`. */
const FREEZE_AT = 2;
const STOP = 16;
const RISE_AT = 6;
const RISE = 30;
const DELTA_AT = 14;
const DELTA = 24;
const HOLD_AT = 38;
const HOLD = 82;

// `column:0` and `column:1` are the before and after columns fading up.
// `run` is both timers running until the fast one stops; `chase` the slow
// one catching up, with the fast one's stop pulse in its beats; `stop` the
// slow one stopping. `rise`, `delta` and `hold` follow in a chain.
export const timerDuelTimeline = defineTimeline<
  TimerDuelElementId,
  TimerDuelTimingProps
>(
  ({
    beforeLabel = "Before",
    afterLabel = "With remocn",
    run = RUN,
    chase = CHASE,
  }) => {
    const stopAfter = START + run;
    const stopBefore = stopAfter + chase;
    const elements: TimelineElement<TimerDuelElementId>[] = [
      {
        id: "column:0",
        lane: "Columns",
        label: beforeLabel,
        start: 0,
        length: APPEAR,
      },
      {
        id: "column:1",
        lane: "Columns",
        label: afterLabel,
        start: COLUMN_GAP,
        length: APPEAR,
        follows: "column:0",
      },
      { id: "run", lane: "Timers", label: "run", start: START, length: run },
      {
        id: "chase",
        lane: "Timers",
        label: "chase",
        start: stopAfter,
        length: chase,
        follows: "run",
        beats: { pulsePeak: PULSE_PEAK, pulse: FAST_PULSE },
      },
      {
        id: "stop",
        lane: "Timers",
        label: "stop",
        start: stopBefore,
        length: STOP,
        follows: "chase",
        beats: {
          pulsePeak: PULSE_PEAK,
          pulse: SLOW_PULSE,
          freezeAt: FREEZE_AT,
        },
      },
      {
        id: "rise",
        lane: "Row",
        label: "rise",
        start: stopBefore + RISE_AT,
        length: RISE,
        follows: "stop",
      },
      {
        id: "delta",
        lane: "Delta",
        label: "delta",
        start: stopBefore + DELTA_AT,
        length: DELTA,
        follows: "rise",
      },
      {
        id: "hold",
        lane: "Delta",
        label: "hold",
        start: stopBefore + HOLD_AT,
        length: HOLD,
        follows: "delta",
      },
    ];
    return elements;
  },
);
