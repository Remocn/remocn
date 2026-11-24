import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The number rising in, then one element per beat of the count: each beat
// steps the number and squashes it on the kick. The caption lands after the
// first beat. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BeatCountElementId = "enter" | `beat:${number}` | "label";

export interface BeatCountTimingProps {
  beats?: number;
  bpm?: number;
}

/** Frames per second of the scene timeline the schedule counts in. */
const FPS = 30;
const FIRST_BEAT = 12;
const ENTER_LEN = 10;

// `enter` is the number rising in. `beat:<k>` is beat `k` of the count, one
// beat long: the number steps and squashes, decaying over `release`. The
// beats chain. `label` is the caption, following the first beat.
export const beatCountTimeline = defineTimeline<
  BeatCountElementId,
  BeatCountTimingProps
>(({ beats = 8, bpm = 120 }) => {
  const n = Math.max(1, Math.round(beats));
  const beatLen = (FPS * 60) / Math.max(30, bpm);
  const release = Math.max(2, beatLen * 0.26);
  const out: TimelineElement<BeatCountElementId>[] = [
    {
      id: "enter",
      lane: "Number",
      label: "enter",
      start: 0,
      length: ENTER_LEN,
    },
  ];
  for (let b = 0; b < n; b++) {
    out.push({
      id: `beat:${b}`,
      lane: "Beats",
      label: `beat ${b + 1}`,
      start: FIRST_BEAT + b * beatLen,
      length: beatLen,
      follows: b > 0 ? `beat:${b - 1}` : undefined,
      beats: { release },
    });
  }
  out.push({
    id: "label",
    lane: "Caption",
    label: "caption",
    start: FIRST_BEAT + beatLen,
    length: 16,
    follows: "beat:0",
  });
  return out.sort((a, b) => a.start - b.start);
});
