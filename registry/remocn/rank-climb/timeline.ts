import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The rank climb: the big rank and the list coming in row by row, then the
// brand row overtaking the rows above it one by one, each overtake quicker
// than the last until the final one into the top spot, and the win landing
// with its caption under a slow push. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type RankClimbElementId =
  | "rank"
  | "rows"
  | "push"
  | "rules"
  | `swap:${number}`
  | "win";

/** A list entry as the schedule reads it (`RankItem`). */
export interface RankEntry {
  label: string;
  value: number;
}

export interface RankClimbTimingProps {
  items?: RankEntry[];
  brand?: string;
  from?: number;
  to?: number;
  climbAt?: number;
  finalSwap?: number;
}

export const DEFAULT_RANK_ITEMS: RankEntry[] = [
  { label: "remocn", value: 2318 },
  { label: "Kitebase", value: 2140 },
  { label: "Lumen", value: 1986 },
  { label: "Fernway", value: 1712 },
  { label: "Quarry", value: 1544 },
  { label: "Orbitly", value: 1390 },
  { label: "Halcyon", value: 1208 },
  { label: "Tessel", value: 1062 },
];

export const T_CLIMB = 28;
export const LAST_DUR = 22;

/**
 * The list without the brand, best first; the brand's entry; the rows; and
 * the slots the brand starts and ends in, with one overtake per slot
 * between (`passed` is the row it overtakes, `s` and `d` its start and
 * length).
 */
export function rankPlan<T extends RankEntry>({
  items,
  brand,
  from,
  to,
  climbAt,
  finalSwap,
}: {
  items: T[];
  brand: string;
  from: number;
  to: number;
  climbAt: number;
  finalSwap: number;
}) {
  const found = items.find((i) => i.label === brand);
  const others = items
    .filter((i) => i.label !== brand)
    .slice()
    .sort((a, b) => b.value - a.value);
  const brandItem: RankEntry = found ?? {
    label: brand,
    value: Math.round((others[0]?.value ?? 1000) * 1.08),
  };
  const n = others.length + 1;
  const start = Math.min(Math.max(1, Math.round(from)), n) - 1;
  const end = Math.min(Math.max(1, Math.round(to)), start + 1) - 1;
  const K = start - end;

  const swaps: { s: number; d: number; passed: number }[] = [];
  let clock = climbAt;
  for (let k = 0; k < K; k++) {
    const last = k === K - 1;
    const gap = K > 1 ? 13 - (5 * k) / Math.max(1, K - 2) : 13;
    const s = clock + (last && K > 1 ? 3 : 0);
    const d = last ? finalSwap : gap * 1.35;
    swaps.push({ s, d, passed: start - 1 - k });
    clock += gap;
  }
  return { others, brandItem, n, start, end, K, swaps };
}

// `rank` fades the big rank in. `rows` brings the row in slot `i` in at
// `i` × `stagger` over `fade`; `rules` draws the hairline under row `i` at
// `i` × `stagger` over `draw`. `swap:<k>` is the brand overtaking one row
// over its length; the overtakes form a chain, and the brand row lifts from
// 4 frames before the first to 6 after the last. `win` follows the last
// overtake: the rank lights up over its length, the other rows dim from
// `dimAt` to `dim` and the caption rises from `captionAt` to `caption`.
// `push` is the slow camera push, ending 60 frames after the last overtake.
export const rankClimbTimeline = defineTimeline<
  RankClimbElementId,
  RankClimbTimingProps
>(
  ({
    items = DEFAULT_RANK_ITEMS,
    brand = "remocn",
    from = 8,
    to = 1,
    climbAt = T_CLIMB,
    finalSwap = LAST_DUR,
  }): TimelineElement<RankClimbElementId>[] => {
    const { others, n, swaps } = rankPlan({
      items,
      brand,
      from,
      to,
      climbAt,
      finalSwap,
    });
    const climbEnd = swaps.length
      ? swaps[swaps.length - 1].s + swaps[swaps.length - 1].d
      : climbAt;
    const elements: TimelineElement<RankClimbElementId>[] = [
      { id: "rank", lane: "Rank", label: "rank", start: -6, length: 22 },
      {
        id: "rows",
        lane: "List",
        label: "rows",
        start: -6,
        length: (n - 1) * 2 + 20,
        beats: { stagger: 2, fade: 20 },
      },
      {
        id: "push",
        lane: "Camera",
        label: "push",
        start: 0,
        length: climbEnd + 60,
      },
      {
        id: "rules",
        lane: "List",
        label: "rules",
        start: 4,
        length: Math.max(0, n - 2) * 2 + 18,
        beats: { stagger: 2, draw: 18 },
      },
    ];
    swaps.forEach((w, k) => {
      elements.push({
        id: `swap:${k}`,
        lane: "Climb",
        label: `passes ${others[w.passed]?.label ?? ""}`.trim(),
        start: w.s,
        length: w.d,
        follows: k > 0 ? `swap:${k - 1}` : undefined,
      });
    });
    elements.push({
      id: "win",
      lane: "Rank",
      label: "win",
      start: climbEnd - 2,
      length: 14,
      follows: swaps.length ? `swap:${swaps.length - 1}` : undefined,
      beats: { dimAt: 2, dim: 20, captionAt: 4, caption: 26 },
    });
    return elements;
  },
);
