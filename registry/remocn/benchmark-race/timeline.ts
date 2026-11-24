import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The caption and the lanes arriving, the race on one shared clock, the
// product lane hitting the finish line, then the camera gliding down and the
// statement landing above the lanes. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop refers
// to them.

export type BenchmarkRaceElementId =
  | "header"
  | `lane:${number}`
  | "race"
  | "hit"
  | "statement";

export interface BenchmarkRaceTimingProps {
  lanes?: { label: string }[];
  /** Frames the product lane takes to cross the finish line. */
  race?: number;
}

export const DEFAULT_LANES = [
  { label: "remocn", seconds: 0.42, highlight: true },
  { label: "Kitebase", seconds: 2.38 },
  { label: "Before", seconds: 5.06 },
];

const START = 22;
const WIN_FRAMES = 42;
const LANE_STAGGER = 4;
const LANE_IN = 20;

// `header` fades the caption in. `lane:<i>` brings lane `i` in over its
// length, `LANE_STAGGER` after the one before it (a chain); its track draws
// from `drawAt` to `drawEnd`. `race` runs every clock from its start; the
// product lane crosses the line over its length, and the clocks brighten
// from `clockAt` (before the start). `hit` (following the race) is the
// finish: the ring pulses over its length, peaking at `pulse` and settling
// at `settle`, the other lanes dim from `dimAt` to `settle`, and the camera
// glides from `glideAt` to `glideEnd`. `statement` lands above the lanes.
export const benchmarkRaceTimeline = defineTimeline<
  BenchmarkRaceElementId,
  BenchmarkRaceTimingProps
>(({ lanes = DEFAULT_LANES, race = WIN_FRAMES }) => {
  const hit = START + race;
  const elements: TimelineElement<BenchmarkRaceElementId>[] = [
    { id: "header", lane: "Lanes", label: "Caption", start: 0, length: 18 },
  ];
  lanes.forEach((l, i) => {
    elements.push({
      id: `lane:${i}`,
      lane: "Lanes",
      label: l.label,
      start: i * LANE_STAGGER,
      length: LANE_IN,
      follows: i > 0 ? `lane:${i - 1}` : undefined,
      beats: { drawAt: 4, drawEnd: 26 },
    });
  });
  elements.push(
    {
      id: "race",
      lane: "Race",
      label: "Race",
      start: START,
      length: race,
      beats: { clockAt: -8 },
    },
    {
      id: "hit",
      lane: "Race",
      label: "Finish",
      start: hit,
      length: 20,
      follows: "race",
      beats: { pulse: 5, settle: 16, dimAt: -2, glideAt: -4, glideEnd: 38 },
    },
    {
      id: "statement",
      lane: "Statement",
      label: "Statement",
      start: hit + 2,
      length: 28,
      follows: "hit",
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
