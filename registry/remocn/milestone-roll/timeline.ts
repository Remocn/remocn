import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The chrome fading in, the counter racing to each milestone, holding it
// big and pushing it away, then the final number, its unit and the logo
// landing as the poster. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type MilestoneRollElementId =
  | "chrome"
  | `milestone:${number}`
  | "poster"
  | "unit"
  | "logo";

export interface MilestoneRollTimingProps {
  milestones?: number[];
  /** Frames the counter races to each milestone. */
  run?: number;
  /** Frames each milestone holds before the next race. */
  hold?: number;
}

export const DEFAULT_MILESTONES = [1000, 10000, 100000, 1000000];
const RUN = 15;
const HOLD = 14;
/** A held milestone is pushed out over `OUT`. */
const OUT = 6;
/** The first race starts this far before the scene. */
const FIRST = -2;
const CHROME_IN = 10;
/** The camera kicks `KICK` after each hit; the screen flashes for `FLASH`. */
const KICK = 3;
const FLASH = 4;
const UNIT_AT = 6;
const UNIT_FADE = 4;
const LOGO_AT = 12;
const LOGO_FADE = 5;

// `milestone:<i>` races the counter to milestone `i` over `hit`, holds it
// big for `hold` and pushes it out over `push`; the next milestone follows.
// The last one only races: `poster` lands its number where it hits (fading
// in from `fadeAt`, the chrome leaving over `chromeOut`, the camera creeping
// from `creepAt` to `creep`), then `unit` and `logo` follow.
export const milestoneRollTimeline = defineTimeline<
  MilestoneRollElementId,
  MilestoneRollTimingProps
>(({ milestones = DEFAULT_MILESTONES, run = RUN, hold = HOLD }) => {
  const n = milestones.length;
  const seg = run + hold + OUT;
  const hitAt = (i: number) => FIRST + i * seg + run;
  const finalAt = hitAt(n - 1);
  const out: TimelineElement<MilestoneRollElementId>[] = [];
  milestones.forEach((value, i) => {
    const last = i === n - 1;
    out.push({
      id: `milestone:${i}`,
      lane: "Counter",
      label: `${value}`,
      start: FIRST + i * seg,
      length: last ? run : seg,
      follows: i > 0 ? `milestone:${i - 1}` : undefined,
      beats: last
        ? { hit: run, kick: KICK, flash: FLASH }
        : { hit: run, hold, push: OUT, kick: KICK, flash: FLASH },
    });
  });
  out.push(
    {
      id: "chrome",
      lane: "Chrome",
      label: "chrome",
      start: 0,
      length: CHROME_IN,
    },
    {
      id: "poster",
      lane: "Poster",
      label: "final number",
      start: finalAt,
      length: UNIT_AT,
      follows: n > 0 ? `milestone:${n - 1}` : undefined,
      beats: { fadeAt: -1, fade: 2, chromeOut: 6, creepAt: 4, creep: 70 },
    },
    {
      id: "unit",
      lane: "Poster",
      label: "unit",
      start: finalAt + UNIT_AT,
      length: UNIT_FADE,
      follows: "poster",
    },
    {
      id: "logo",
      lane: "Poster",
      label: "logo",
      start: finalAt + LOGO_AT,
      length: LOGO_FADE,
      follows: "unit",
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
