import { z } from "zod";

/**
 * Live traffic for the sponsors page, read from our self-hosted OpenPanel
 * (Insights + Export API) with the same client as server-side tracking
 * (`NEXT_PUBLIC_OPENPANEL_CLIENT_ID` + `OPENPANEL_CLIENT_SECRET`, see
 * `lib/server/analytics.ts`). The client needs read access.
 *
 * Responses are cached for an hour. When the keys are missing or a request
 * fails, `getSponsorTraffic()` returns null and the section isn't rendered.
 */

const API_URL = (
  process.env.NEXT_PUBLIC_OPENPANEL_API_URL ?? "https://api.openpanel.dev"
).replace(/\/$/, "");

export const OPENPANEL_DASHBOARD_URL =
  process.env.OPENPANEL_PUBLIC_DASHBOARD_URL;

const PROJECT_ID = "remocn";
const RANGE = "30d";
const REVALIDATE_SECONDS = 3600;

const zMetrics = z.object({
  metrics: z.object({
    unique_visitors: z.number(),
    total_sessions: z.number(),
    total_screen_views: z.number(),
    avg_session_duration: z.number(),
    views_per_session: z.number(),
  }),
  series: z.array(z.object({ date: z.string(), unique_visitors: z.number() })),
});

const zTop = z.array(
  z.object({
    // null = no referrer (direct visit)
    name: z.string().nullable(),
    prefix: z.string().nullish(),
    sessions: z.number(),
  }),
);

const zEventCount = z.object({
  meta: z.object({ totalCount: z.number() }),
});

export type TrafficRow = { name: string; sessions: number };

export type SponsorTraffic = {
  /** True for the dev-only layout sample (no OpenPanel keys locally). */
  sample?: boolean;
  range: { start: string; end: string };
  uniqueVisitors: number;
  pageviews: number;
  sessions: number;
  /** Seconds. */
  avgSessionDuration: number;
  viewsPerSession: number;
  /** Unique visitors per day. */
  series: { date: string; visitors: number }[];
  referrers: TrafficRow[];
  countries: TrafficRow[];
  devices: TrafficRow[];
  /** All-time `registry_install` events (`npx shadcn add @remocn/…`). */
  registryInstalls: number;
};

async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "openpanel-client-id": process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ?? "",
      "openpanel-client-secret": process.env.OPENPANEL_CLIENT_SECRET ?? "",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`OpenPanel ${path}: ${res.status}`);
  return schema.parse(await res.json());
}

const toRows = (rows: z.infer<typeof zTop>, limit: number): TrafficRow[] =>
  rows
    .slice(0, limit)
    .map(({ name, sessions }) => ({ name: name || "Direct", sessions }));

// "https://l.chatplace.io" → "l.chatplace.io", "Twitter" → "X (Twitter)";
// local dev sessions are dropped.
function toReferrerRows(rows: z.infer<typeof zTop>, limit: number) {
  return toRows(
    rows
      .map((row) => ({
        ...row,
        name:
          row.name?.replace(/^https?:\/\//, "").replace(/^www\./, "") ?? null,
      }))
      .filter((row) => !row.name?.match(/^(localhost|127\.0\.0\.1)(:|$)/))
      .map((row) =>
        row.name === "Twitter" ? { ...row, name: "X (Twitter)" } : row,
      ),
    limit,
  );
}

export async function getSponsorTraffic(): Promise<SponsorTraffic | null> {
  if (
    !process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID ||
    !process.env.OPENPANEL_CLIENT_SECRET
  ) {
    return null;
  }

  const insights = (column: string) =>
    `/insights/${PROJECT_ID}/${column}?range=${RANGE}`;

  try {
    const [metrics, referrers, countries, devices, installs] =
      await Promise.all([
        get(insights("metrics"), zMetrics),
        get(insights("referrer_name"), zTop),
        get(insights("country"), zTop),
        get(insights("device"), zTop),
        get(
          `/export/events?projectId=${PROJECT_ID}&event=registry_install&limit=1`,
          zEventCount,
        ),
      ]);

    const series = metrics.series.map((point) => ({
      date: point.date,
      visitors: point.unique_visitors,
    }));

    return {
      range: {
        start: series[0]?.date ?? "",
        end: series.at(-1)?.date ?? "",
      },
      uniqueVisitors: metrics.metrics.unique_visitors,
      pageviews: metrics.metrics.total_screen_views,
      sessions: metrics.metrics.total_sessions,
      avgSessionDuration: metrics.metrics.avg_session_duration,
      viewsPerSession: metrics.metrics.views_per_session,
      series,
      referrers: toReferrerRows(referrers, 6),
      countries: toRows(countries, 6),
      devices: toRows(devices, 3),
      registryInstalls: installs.meta.totalCount,
    };
  } catch {
    return null;
  }
}

// Numbers from the Paper design, so the section can be built and reviewed in
// local dev without OpenPanel read keys. Never used in production.
const DEV_SAMPLE: SponsorTraffic = {
  sample: true,
  range: { start: "2026-09-24", end: "2026-10-23" },
  uniqueVisitors: 8762,
  pageviews: 107927,
  sessions: 9755,
  avgSessionDuration: 475,
  viewsPerSession: 11,
  series: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 8, 24 + i)).toISOString().slice(0, 10);
    const wave = 230 + 70 * Math.sin(i * 0.9) + 40 * Math.sin(i * 2.3);
    return { date, visitors: Math.round(i === 22 ? 614 : wave) };
  }),
  referrers: [
    { name: "Direct", sessions: 5789 },
    { name: "X (Twitter)", sessions: 1184 },
    { name: "Google", sessions: 1153 },
    { name: "ui.shadcn.com", sessions: 598 },
    { name: "lchatplace.io", sessions: 177 },
    { name: "toolfolio.com", sessions: 95 },
  ],
  countries: [
    { name: "US", sessions: 1450 },
    { name: "IN", sessions: 1037 },
    { name: "SG", sessions: 734 },
    { name: "BR", sessions: 563 },
    { name: "JP", sessions: 441 },
    { name: "FR", sessions: 414 },
  ],
  devices: [
    { name: "desktop", sessions: 7942 },
    { name: "mobile", sessions: 1789 },
    { name: "tablet", sessions: 24 },
  ],
  registryInstalls: 162650,
};

/** Live data, or the design sample in local dev when keys are missing. */
export async function getSponsorTrafficForPage(): Promise<SponsorTraffic | null> {
  const live = await getSponsorTraffic();
  if (live) return live;
  return process.env.NODE_ENV === "development" ? DEV_SAMPLE : null;
}
