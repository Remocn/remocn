import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The portrait settling in, then one punch-in and ink swap on every beat
// until the clip ends. Frames on the 30 fps scene timeline, after `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type DuotoneBeatElementId = "intro" | `beat:${number}`;

export interface DuotoneBeatTimingProps {
  /** Frames per beat at 30fps. Ignored when `bpm` is set. */
  beatFrames?: number;
  bpm?: number;
}

export const BEAT_FRAMES = 15;
const INTRO = 12;

/** Frames per beat for `bpm`, or `beatFrames` without it; at least 1. */
export function beatPeriodOf(bpm: number | undefined, beatFrames: number) {
  return Math.max(1, bpm ? (30 * 60) / bpm : beatFrames);
}

// `intro` lifts the portrait into place. Each `beat:<k>` is one beat, a
// chain filling the clip: the image punches in at its start and decays, and
// the ink pair and the bar position step with it. The beat that started
// last is the one on screen.
export const duotoneBeatTimeline = defineTimeline<
  DuotoneBeatElementId,
  DuotoneBeatTimingProps
>(({ beatFrames = BEAT_FRAMES, bpm }, { length }) => {
  const period = beatPeriodOf(bpm, beatFrames);
  const count = Math.max(1, Math.ceil(length / period));
  const out: TimelineElement<DuotoneBeatElementId>[] = [
    {
      id: "intro",
      lane: "Intro",
      label: "portrait in",
      start: 0,
      length: INTRO,
    },
  ];
  for (let k = 0; k < count; k++) {
    out.push({
      id: `beat:${k}`,
      lane: "Beats",
      label: `beat ${k + 1}`,
      start: k * period,
      length: period,
      follows: k > 0 ? `beat:${k - 1}` : undefined,
    });
  }
  return out;
});
