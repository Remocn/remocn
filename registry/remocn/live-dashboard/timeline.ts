import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dashboard window rising in under a slow camera push, the headings, the
// headline count-up, the chart drawing, the payments feed and the KPI tiles,
// then each live payment landing. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type LiveDashboardElementId =
  | "app"
  | "camera"
  | "head"
  | "count"
  | `payment:${number}`
  | "draw"
  | `kpi:${number}`
  | `tick:${number}`;

export interface DashboardMetric {
  label: string;
  value: number;
  format?: "currency" | "number" | "percent";
  decimals?: number;
  /** Percent change shown next to the label. */
  change: number;
  /** Which direction is good news (colors the change). Default "up". */
  goodWhen?: "up" | "down";
  /** Sparkline values; generated when omitted. */
  spark?: number[];
  /** Added to the value on every live tick. */
  liveStep?: number;
}

export interface DashboardTick {
  customer: string;
  amount: number;
}

export interface LiveDashboardTimingProps {
  metrics?: { label: string }[];
  live?: DashboardTick[];
  payments?: DashboardTick[];
}

export const DEFAULT_METRICS: DashboardMetric[] = [
  { label: "MRR", value: 84210, format: "currency", change: 8.2 },
  {
    label: "Active users",
    value: 12408,
    format: "number",
    change: 4.1,
    liveStep: 3,
  },
  {
    label: "Conversion",
    value: 3.84,
    format: "percent",
    decimals: 2,
    change: 0.6,
  },
  {
    label: "Churn",
    value: 1.2,
    format: "percent",
    decimals: 1,
    change: -0.3,
    goodWhen: "down",
  },
];
export const DEFAULT_LIVE: DashboardTick[] = [
  { customer: "Fernway", amount: 2480 },
  { customer: "Tessel Labs", amount: 1920.5 },
  { customer: "Lumen Studio", amount: 3150 },
];
export const DEFAULT_PAYMENTS: DashboardTick[] = [
  { customer: "Quarry", amount: 1240 },
  { customer: "Orbitly", amount: 560 },
  { customer: "Halcyon Health", amount: 2100 },
];

const B = {
  app: 0,
  head: 8,
  count: 12,
  draw: 16,
  feed: 14,
  kpi: 20,
  live: [84, 110, 132],
};
const STAGGER = 3;
/** Each heading rises over this many frames. */
const RISE = 14;

// `app` fades the window in over its length while it rises. `camera` is the
// slow push across the whole clip. `head` raises the title row, then the
// chart's label at `chartAt` and the feed's heading at `feedAt`, each over
// `rise`. `count` counts the headline up over its length; it fades in over
// `fade` and the change under it rises from `changeAt` over `rise`. `draw`
// draws the chart over its length; yesterday's line fades in from
// `yesterdayAt` to `yesterdayEnd`, and the drop line under the dot from
// `dropAt` over `drop`. `payment:<j>` slides feed row `j` in (a chain).
// `kpi:<i>` brings tile `i` in (a chain): its value rolls from `rollAt` over
// `roll`, its sparkline draws from `sparkAt` to its end, its change fades in
// from `changeAt` over `change`. `tick:<i>` lands live payment `i` (a chain):
// the chart and feed settle over its length, the amount chip leaves from
// `popOutAt` over `popOut`, the feed row glows for `glow`, and the KPI
// values roll `kpiLag` behind.
export const liveDashboardTimeline = defineTimeline<
  LiveDashboardElementId,
  LiveDashboardTimingProps
>(
  ({
    metrics = DEFAULT_METRICS,
    live = DEFAULT_LIVE,
    payments = DEFAULT_PAYMENTS,
  }) => {
    const tickAt = live.map(
      (_, i) =>
        B.live[i] ?? B.live[B.live.length - 1] + (i - B.live.length + 1) * 22,
    );
    const elements: TimelineElement<LiveDashboardElementId>[] = [
      { id: "app", lane: "Window", label: "Window", start: B.app, length: 12 },
      { id: "camera", lane: "Camera", label: "Push-in", start: 0, length: 190 },
      {
        id: "head",
        lane: "Headings",
        label: "Headings",
        start: B.head,
        length: RISE,
        beats: { rise: RISE, chartAt: 3, feedAt: 6 },
      },
      {
        id: "count",
        lane: "Headline",
        label: "Count-up",
        start: B.count,
        length: 40,
        beats: { fade: 8, changeAt: 30, rise: RISE },
      },
      {
        id: "draw",
        lane: "Chart",
        label: "Chart",
        start: B.draw,
        length: 46,
        beats: { yesterdayAt: 4, yesterdayEnd: 28, dropAt: 40, drop: 8 },
      },
    ];
    payments.forEach((p, j) => {
      elements.push({
        id: `payment:${j}`,
        lane: "Feed",
        label: p.customer,
        start: B.feed + j * STAGGER,
        length: STAGGER,
        follows: j > 0 ? `payment:${j - 1}` : undefined,
      });
    });
    metrics.slice(0, 4).forEach((m, i) => {
      elements.push({
        id: `kpi:${i}`,
        lane: "KPIs",
        label: m.label,
        start: B.kpi + i * STAGGER,
        length: 44,
        follows: i > 0 ? `kpi:${i - 1}` : undefined,
        beats: { rollAt: 2, roll: 36, sparkAt: 6, changeAt: 30, change: 10 },
      });
    });
    live.forEach((p, i) => {
      elements.push({
        id: `tick:${i}`,
        lane: "Live",
        label: p.customer,
        start: tickAt[i],
        length: 18,
        follows: i > 0 ? `tick:${i - 1}` : undefined,
        beats: { popOutAt: 14, popOut: 8, glow: 36, kpiLag: 2 },
      });
    });
    return elements
      .map((e, k) => ({ e, k }))
      .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
      .map(({ e }) => e);
  },
);
