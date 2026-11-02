import { z } from "zod";

/**
 * Registry health from the official shadcn directory. ui.shadcn.com checks
 * every listed registry (index hourly, items daily, CLI dry-run weekly) and
 * publishes the result in `registries.json`. Scoring:
 * https://ui.shadcn.com/docs/registry/health
 */
const REGISTRIES_URL = "https://ui.shadcn.com/r/registries.json";
const REGISTRY_NAME = "@remocn";

export const REGISTRY_HEALTH_DOCS_URL =
  "https://ui.shadcn.com/docs/registry/health";

// Checks run hourly; anything older means the data stopped updating (on their
// side, or our fetch keeps failing and serving a stale cache), so hide it.
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const healthSchema = z.object({
  // The breakdown maximums below only hold for score version 1; any other
  // version fails parsing and the badge is hidden rather than misreported.
  scoreVersion: z.literal(1),
  status: z.enum(["observing", "healthy", "degraded", "unavailable"]),
  statusReason: z.object({ message: z.string() }),
  score: z.number(),
  breakdown: z.object({
    reliability: z.number(),
    correctness: z.number(),
    installability: z.number(),
    hygiene: z.number(),
  }),
  checkedAt: z.iso.datetime(),
});

const registriesSchema = z.array(
  z.object({ name: z.string(), health: z.unknown().optional() }),
);

export type RegistryHealthStatus = z.infer<typeof healthSchema>["status"];

export type RegistryHealthCheck = {
  label: string;
  score: number;
  max: number;
};

export type RegistryHealth = {
  status: RegistryHealthStatus;
  /** Total out of 100. */
  score: number;
  /** Human sentence from the checker, e.g. "Recent checks are within…". */
  summary: string;
  /** ISO timestamp of the last check. */
  checkedAt: string;
  checks: RegistryHealthCheck[];
};

const BREAKDOWN: {
  key: keyof z.infer<typeof healthSchema>["breakdown"];
  label: string;
  max: number;
}[] = [
  { key: "reliability", label: "Reliability", max: 45 },
  { key: "correctness", label: "Correctness", max: 25 },
  { key: "installability", label: "Installability", max: 20 },
  { key: "hygiene", label: "Setup", max: 10 },
];

/** Latest health of the remocn registry, or null when unknown or stale. */
export async function getRegistryHealth(): Promise<RegistryHealth | null> {
  try {
    const res = await fetch(REGISTRIES_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const registries = registriesSchema.parse(await res.json());
    const entry = registries.find((item) => item.name === REGISTRY_NAME);
    const health = healthSchema.safeParse(entry?.health).data;
    if (!health) return null;

    if (Date.now() - new Date(health.checkedAt).getTime() > MAX_AGE_MS) {
      return null;
    }

    return {
      status: health.status,
      score: health.score,
      summary: health.statusReason.message,
      checkedAt: health.checkedAt,
      checks: BREAKDOWN.map(({ key, label, max }) => ({
        label,
        score: health.breakdown[key],
        max,
      })),
    };
  } catch {
    return null;
  }
}

export const REGISTRY_HEALTH_STATUS_LABEL: Record<
  RegistryHealthStatus,
  string
> = {
  observing: "Observing",
  healthy: "Healthy",
  degraded: "Degraded",
  unavailable: "Unavailable",
};

const POINTS = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** 98.931 → "98.9", 10 → "10". */
export function formatHealthPoints(value: number): string {
  return POINTS.format(value);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "23 Oct, 14:32 UTC" — formatted by hand so server and client agree. */
export function formatHealthCheckedAt(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())} UTC`;
}
