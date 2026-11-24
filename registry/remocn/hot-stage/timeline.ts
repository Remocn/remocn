import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Hot staging, line by line: the first line rises in, then each next line
// ignites above the one before, venting into it, pairs with it, pushes it
// out (it dims and falls away) and settles into its place; a mission-log
// entry lights up with each ignition. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type HotStageElementId = `line:${number}` | `entry:${number}`;

export interface HotStageTimingProps {
  lines?: string[];
  log?: string[];
  stage?: number;
  /** Frames the first line holds alone before the next one ignites. */
  hold?: number;
}

export const DEFAULT_LINES = [
  "Storyboard the launch.",
  "Render on your laptop.",
  "Clear the tower.",
];
export const DEFAULT_LOG = [
  "T+00:00  Liftoff",
  "T+02:41  Hot staging",
  "T+08:32  Orbit",
];
const STAGE = 44;
const FIRST_AT = 30;
const ENTER_LEN = 16;
/** An ignited line fades in over `FADE`, pairs over `PAIR`, settles from `SETTLE` to its end. */
const FADE = 10;
const PAIR = 14;
const SETTLE = 16;
const SETTLED = 38;
/** Its vents flare to full by `VENT_ON`, burn to `VENT_BURN`, die by `VENT_OUT`, drawn over `VENT_DRAW`. */
const VENT_ON = 5;
const VENT_BURN = 16;
const VENT_OUT = 26;
const VENT_DRAW = 6;
/** The line below dims from `SPENT` to `SPENT_END` and falls from `FALL` to `FALL_END`. */
const SPENT = 6;
const SPENT_END = 18;
const FALL = 16;
const FALL_END = 40;
const ENTRY = 8;

/** The lines shown: one empty line when there are none. */
export function stageLines(lines: string[]) {
  return lines.length > 0 ? lines : [""];
}

// `line:0` rises in. `line:<i>` ignites the next stage: its own fade, pair
// and settle, its vents, and the push that sends the line below away, all as
// beats from its start. Each line follows the one before. `entry:<i>` lights
// log entry `i` with line `i`.
export const hotStageTimeline = defineTimeline<
  HotStageElementId,
  HotStageTimingProps
>(
  ({
    lines = DEFAULT_LINES,
    log = DEFAULT_LOG,
    stage = STAGE,
    hold = FIRST_AT,
  }) => {
    const list = stageLines(lines);
    const ign = (i: number) => hold + (i - 1) * stage;
    const elements: TimelineElement<HotStageElementId>[] = list.map(
      (line, i) =>
        i === 0
          ? {
              id: "line:0",
              lane: "Lines",
              label: line,
              start: 0,
              length: ENTER_LEN,
            }
          : {
              id: `line:${i}`,
              lane: "Lines",
              label: line,
              start: ign(i),
              length: SETTLED,
              follows: `line:${i - 1}`,
              beats: {
                fade: FADE,
                pair: PAIR,
                settle: SETTLE,
                ventOn: VENT_ON,
                ventBurn: VENT_BURN,
                ventOut: VENT_OUT,
                ventDraw: VENT_DRAW,
                spent: SPENT,
                spentEnd: SPENT_END,
                fall: FALL,
                fallEnd: FALL_END,
              },
            },
    );
    log.forEach((entry, i) => {
      elements.push({
        id: `entry:${i}`,
        lane: "Log",
        label: entry,
        start: i === 0 ? 0 : ign(i),
        length: ENTRY,
        follows: i < list.length ? `line:${i}` : `entry:${i - 1}`,
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
