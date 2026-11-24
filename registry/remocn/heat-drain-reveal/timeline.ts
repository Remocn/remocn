import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heat-drain reveal: the headline rises word by word and recedes, the
// calendar rises and tilts flat while a slow push runs under everything, the
// heat drains down the grid, a halo lights the launch day and its chip pops.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type HeatDrainRevealElementId =
  | `word:${number}`
  | "rise"
  | "recede"
  | "push"
  | "drain"
  | "halo"
  | "chip";

export interface HeatDrainRevealTimingProps {
  headline?: string;
  stagger?: number;
}

export const DEFAULT_HEADLINE = "Plan the whole launch week.";
export const DEFAULT_STAGGER = 2;

// The headline's words start before the first frame: frame 0 already shows
// them rising.
const B = {
  words: -10,
  recede: 8,
  rise: 4,
  drain: 24,
  drainLen: 48,
  tiltEnd: 78,
  halo: 52,
  chip: 78,
  end: 126,
};

export const HEAT_DRAIN_REVEAL_END = B.end;

export const heatDrainRevealTimeline = defineTimeline<
  HeatDrainRevealElementId,
  HeatDrainRevealTimingProps
>(({ headline = DEFAULT_HEADLINE, stagger = DEFAULT_STAGGER }) => {
  const elements: TimelineElement<HeatDrainRevealElementId>[] = headline
    .split(" ")
    .map((w, i) => ({
      id: `word:${i}`,
      lane: "Words",
      label: w,
      start: B.words + i * stagger,
      length: 14,
      follows: i > 0 ? `word:${i - 1}` : undefined,
    }));
  elements.push(
    {
      id: "rise",
      lane: "Calendar",
      label: "calendar rises and tilts flat",
      start: B.rise,
      length: B.tiltEnd - B.rise,
    },
    {
      id: "recede",
      lane: "Headline",
      label: "headline recedes",
      start: B.recede,
      length: 14,
    },
    {
      id: "push",
      lane: "Camera",
      label: "push in",
      start: B.rise + 20,
      length: B.end - B.rise - 20,
    },
    {
      id: "drain",
      lane: "Heat",
      label: "heat drains",
      start: B.drain,
      length: B.drainLen,
    },
    {
      id: "halo",
      lane: "Heat",
      label: "halo on launch day",
      start: B.halo,
      length: 30,
      // One swing of the halo's breathing.
      beats: { breath: 36 },
    },
    {
      id: "chip",
      lane: "Calendar",
      label: "launch chip",
      start: B.chip,
      length: 12,
      // The chip fills over `fill`; its label fades in from `label` over `labelIn`.
      beats: { fill: 4, label: 4, labelIn: 8 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
