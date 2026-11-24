import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The broadcast score bug: the panel opening, one digit flip per goal with
// its scorer line, then the flash band sweeping across into the full-time
// poster. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type ScoreBugElementId = "open" | `goal:${number}` | "band";

export interface ScoreBugTimingProps {
  score?: number;
  scorers?: string[];
  firstGoal?: number;
  goalGap?: number;
}

export const DEFAULT_SCORERS = ["Install 12′", "Ship 47′"];
/** The scene starts this far into its choreography: frame 0 already moves. */
export const PREROLL = 2;
const GOAL_AT = 30;
const GOAL_GAP = 18;
const FLIP = 6;
const BAND_DELAY = 12;
const BAND_IN = 7;
const BAND_HOLD = 9;
const BAND_OUT = 7;

// `open` is the entrance, counted from its start: the core slams open over
// `core`, the blocks shoot out from `blocksAt` over `blocks`, the digits drop
// from `digitsAt`, the names from `namesAt`, the tab rises from `tabAt`, and
// the panel kicks at `kick`. `goal:<i>` flips the home digit to i + 1 over
// `flip`, kicks the panel at `kick`, flashes the home block from `flashAt`
// over `flash` and drops the scorer line from `scorerAt` over `scorer`; it
// runs until the next goal. `band` sweeps in over `in`, holds over `hold`
// and leaves from `outAt` over `out`; the tab turns to full time at `final`
// and the opponent dims over `dim`.
export const scoreBugTimeline = defineTimeline<
  ScoreBugElementId,
  ScoreBugTimingProps
>(
  ({
    score = 2,
    scorers = DEFAULT_SCORERS,
    firstGoal = GOAL_AT,
    goalGap = GOAL_GAP,
  }) => {
    const goals = Math.max(0, Math.floor(score));
    const goalAt = Array.from(
      { length: goals },
      (_, i) => firstGoal + i * goalGap,
    );
    const bandAt = (goalAt[goals - 1] ?? firstGoal - goalGap) + BAND_DELAY;
    const elements: TimelineElement<ScoreBugElementId>[] = [
      {
        id: "open",
        lane: "Panel",
        label: "panel opens",
        start: 0 - PREROLL,
        length: 20,
        beats: {
          core: 6,
          blocksAt: 3,
          blocks: 10,
          digitsAt: 6,
          digits: 8,
          namesAt: 8,
          names: 9,
          tabAt: 12,
          tab: 8,
          kick: 5,
        },
      },
    ];
    goalAt.forEach((at, i) => {
      elements.push({
        id: `goal:${i}`,
        lane: "Goals",
        label: scorers[i] ?? `goal ${i + 1}`,
        start: at - PREROLL,
        length: (goalAt[i + 1] ?? bandAt) - at,
        follows: i > 0 ? `goal:${i - 1}` : undefined,
        beats: {
          flip: FLIP,
          kick: 2,
          flashAt: 1,
          flash: 10,
          scorerAt: 4,
          scorer: 8,
        },
      });
    });
    elements.push({
      id: "band",
      lane: "Band",
      label: "flash band",
      start: bandAt - PREROLL,
      length: BAND_IN + BAND_HOLD + BAND_OUT,
      follows: goals > 0 ? `goal:${goals - 1}` : undefined,
      beats: {
        in: BAND_IN,
        hold: BAND_HOLD,
        outAt: BAND_IN + BAND_HOLD,
        out: BAND_OUT,
        final: BAND_IN + 4,
        dim: 6,
      },
    });
    return elements;
  },
);
