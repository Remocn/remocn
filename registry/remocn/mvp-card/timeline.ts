import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The card slamming open, the light sweeping its face, the giant title
// rising letter by letter, the name row and the kicker sliding in, then
// each stat row counting to its value; the gradient drifts under it all.
// Frames on the 30 fps scene timeline, after `delay` and `speed`, counted
// from frame 1 (the scene starts one frame into the slam). The ids are
// public: a saved `timing` prop refers to them.

export type MvpCardElementId =
  | "drift"
  | "card"
  | "sweep"
  | "title"
  | "name"
  | "kicker"
  | `stat:${number}`;

export interface MvpCardTimingProps {
  title?: string;
  stats?: object[];
  stagger?: number;
  countDuration?: number;
}

export const DEFAULT_MVP_STATS = [
  { value: 12.4, decimals: 1, label: "Renders / min" },
  { value: 0, from: 37, label: "Bugs" },
  { value: 100, suffix: "%", label: "Uptime" },
];

// `card` opens over `open` and settles over its length; the frame kicks at
// `hit`. `title` raises a letter every `stagger` frames, each over `rise`;
// the frame kicks again `land` frames after the last letter starts.
// `stat:<i>` counts row i over its length, the row sliding in from
// `rowFrom` over `row`; each stat follows the one before.
export const mvpCardTimeline = defineTimeline<
  MvpCardElementId,
  MvpCardTimingProps
>(
  ({
    title = "MVP",
    stats = DEFAULT_MVP_STATS,
    stagger = 8,
    countDuration = 22,
  }) => {
    const letters = Array.from(title.toUpperCase()).length;
    const elements: TimelineElement<MvpCardElementId>[] = [
      { id: "drift", lane: "Scene", label: "Drift", start: 0, length: 120 },
      {
        id: "card",
        lane: "Card",
        label: "Card slam",
        start: 0,
        length: 9,
        beats: { open: 6, hit: 4 },
      },
      { id: "sweep", lane: "Card", label: "Sweep", start: 3, length: 11 },
      {
        id: "title",
        lane: "Title",
        label: "Title",
        start: 5,
        length: Math.max(0, letters - 1) * 3 + 9,
        beats: { stagger: 3, rise: 9, land: 5 },
      },
      { id: "name", lane: "Card", label: "Name row", start: 11, length: 10 },
      { id: "kicker", lane: "Kicker", label: "Kicker", start: 13, length: 10 },
      ...stats.map(
        (_, i): TimelineElement<MvpCardElementId> => ({
          id: `stat:${i}`,
          lane: "Stats",
          label: `Stat ${i + 1}`,
          start: 18 + i * stagger,
          length: countDuration,
          follows: i > 0 ? `stat:${i - 1}` : undefined,
          beats: { rowFrom: -2, row: 8 },
        }),
      ),
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
