import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The frame splitting on a diagonal, "VS" slamming onto the seam, the stat
// rows landing one by one, then the remocn half lighting up while the
// other half dims. Frames on the 30 fps scene timeline, after `delay` and
// `speed`; the scene's own clock runs `PREROLL` frames ahead of them, so
// the split is already under way on frame 0. The ids are public: a saved
// `timing` prop refers to them.

export type VersusSplitElementId =
  | "split"
  | "versus"
  | `row:${number}`
  | "light";

export interface VersusStat {
  /** Small caps label on the seam: "Time to ship". */
  label: string;
  /** remocn's value, left side. */
  home: string;
  /** The opponent's value, right side. */
  away: string;
}

export interface VersusSplitTimingProps {
  stats?: VersusStat[];
  stagger?: number;
}

/** Frames the scene's clock runs ahead of the schedule. */
export const PREROLL = 2;

export const DEFAULT_STATS: VersusStat[] = [
  { label: "Time to ship", home: "1 day", away: "3 weeks" },
  { label: "Cost", home: "$0", away: "$12K" },
  { label: "Revisions", home: "1 round", away: "7 rounds" },
];

// On the scene's clock (scene frame + PREROLL).
const SPLIT_LEN = 10;
const VS_AT = 12;
const VS_LEN = 7;
const ROWS_AT = 26;
const ROW_GAP = 7;
const ROW_LEN = 9;
const LIGHT_DELAY = 10;
const LIGHT_LEN = 9;

// The seam flashes for `flash` frames as the halves meet. "VS" fades in
// over `fade` while it slams. Each row's values fade in over `fade` and its
// plate opens over `plate`; the rows form a chain and the light follows
// the last one. The light wipes over its length, the other half dims from
// `dimAt` over `dim`, and the halo drifts for `drift`.
export const versusSplitTimeline = defineTimeline<
  VersusSplitElementId,
  VersusSplitTimingProps
>(
  ({
    stats = DEFAULT_STATS,
    stagger = ROW_GAP,
  }): TimelineElement<VersusSplitElementId>[] => {
    const rowsEnd = ROWS_AT + (stats.length - 1) * stagger + ROW_LEN;
    const lightAt = rowsEnd + LIGHT_DELAY;
    return [
      {
        id: "split",
        lane: "Split",
        label: "split",
        start: 0 - PREROLL,
        length: SPLIT_LEN,
        beats: { flash: 8 },
      },
      {
        id: "versus",
        lane: "Versus",
        label: "VS",
        start: VS_AT - PREROLL,
        length: VS_LEN,
        beats: { fade: 3 },
      },
      ...stats.map(
        (s, i): TimelineElement<VersusSplitElementId> => ({
          id: `row:${i}`,
          lane: "Rows",
          label: s.label,
          start: ROWS_AT + i * stagger - PREROLL,
          length: ROW_LEN,
          follows: i > 0 ? `row:${i - 1}` : undefined,
          beats: { fade: 3, plate: 5 },
        }),
      ),
      {
        id: "light",
        lane: "Light",
        label: "light up",
        start: lightAt - PREROLL,
        length: LIGHT_LEN,
        follows: stats.length > 0 ? `row:${stats.length - 1}` : undefined,
        beats: { dimAt: 3, dim: 6, drift: 60 },
      },
    ];
  },
);
