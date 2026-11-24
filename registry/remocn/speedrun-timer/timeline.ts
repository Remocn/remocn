import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The header and the splits panel coming in, each split row rising in, the
// run starting, each split being hit (the last one is the finish), the
// "World record" banner landing and the ground rising. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type SpeedrunTimerElementId =
  | "header"
  | "panel"
  | `row:${number}`
  | "run"
  | `split:${number}`
  | "banner"
  | "ground";

export interface SpeedrunSplit {
  name: string;
  /** Cumulative run time at this split, in seconds. */
  time: number;
  /** Cumulative personal-best time at this split, in seconds. */
  pb: number;
}

export interface SpeedrunTimerTimingProps {
  splits?: SpeedrunSplit[];
}

export const DEFAULT_SPLITS: SpeedrunSplit[] = [
  { name: "Script", time: 521, pb: 563 },
  { name: "Edit", time: 1635, pb: 1703 },
  { name: "Captions", time: 2162, pb: 2143 },
  { name: "Render", time: 2910, pb: 3041 },
  { name: "Ship", time: 3552, pb: 3737 },
];

const BEATS = {
  rowIn: 0,
  rowGap: 3,
  run: 12,
  splits: [30, 50, 66, 84, 102],
  banner: 106,
  rise: 102,
} as const;
/** Splits past the fifth come this many frames apart. */
const EXTRA_GAP = 18;

// `panel` springs in, its rows (`row:<i>`, a chain) rising after it, the
// personal best fading in on `pbAt` over `pb`. `run` starts the clock; the
// timer runs through each `split:<i>` (a chain): a split flashes its row
// over `rowFlash` and tints the timer over `tint`. The last split is the
// finish: the screen flashes over `flash`, the personal best pops on `pbAt`
// and the current-split band leaves over `bandOut`. `banner` lands with two
// blinks.
export const speedrunTimerTimeline = defineTimeline<
  SpeedrunTimerElementId,
  SpeedrunTimerTimingProps
>(({ splits = DEFAULT_SPLITS }) => {
  const n = splits.length;
  const last = BEATS.splits[BEATS.splits.length - 1];
  const frames = splits.map(
    (_, i) => BEATS.splits[i] ?? last + EXTRA_GAP * (i - 4),
  );
  const out: TimelineElement<SpeedrunTimerElementId>[] = [
    { id: "header", lane: "Chrome", label: "header", start: 0, length: 10 },
    {
      id: "panel",
      lane: "Panel",
      label: "splits panel",
      start: BEATS.rowIn,
      length: 4,
      beats: { pbAt: 4, pb: 12 },
    },
  ];
  splits.forEach((s, i) => {
    out.push({
      id: `row:${i}`,
      lane: "Rows",
      label: s.name,
      start: BEATS.rowIn + 2 + i * BEATS.rowGap,
      length: 4,
      follows: i > 0 ? `row:${i - 1}` : "panel",
    });
  });
  out.push({
    id: "run",
    lane: "Timer",
    label: "run starts",
    start: BEATS.run,
    length: n > 0 ? frames[0] - BEATS.run : 0,
    beats: { bandAt: -4, band: 6 },
  });
  splits.forEach((s, i) => {
    const finish = i === n - 1;
    out.push({
      id: `split:${i}`,
      lane: "Timer",
      label: s.name,
      start: frames[i],
      length: finish ? 4 : frames[i + 1] - frames[i],
      follows: i > 0 ? `split:${i - 1}` : "run",
      beats: finish
        ? { rowFlash: 12, tint: 10, flash: 4, pbAt: 2, pb: 3, bandOut: 6 }
        : { rowFlash: 12, tint: 10 },
    });
  });
  const finishAt = frames[n - 1];
  const after = (at: number): SpeedrunTimerElementId | undefined =>
    n > 0 && finishAt <= at ? `split:${n - 1}` : undefined;
  out.push(
    {
      id: "banner",
      lane: "Banner",
      label: "banner",
      start: BEATS.banner,
      length: 13,
      follows: after(BEATS.banner),
      beats: { fade: 2, blinkA: 6, blinkAEnd: 8, blinkB: 11, blinkBEnd: 13 },
    },
    {
      id: "ground",
      lane: "Ground",
      label: "ground rise",
      start: BEATS.rise,
      length: 28,
      follows: after(BEATS.rise),
    },
  );
  return out.sort((a, b) => a.start - b.start);
});
