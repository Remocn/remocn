/**
 * Client-safe half of the registry health badge: types, labels and
 * formatters. The fetch and its zod schemas stay in `registry-health.ts`, so
 * the header's client components don't pull zod into every page.
 */

export const REGISTRY_HEALTH_DOCS_URL =
  "https://ui.shadcn.com/docs/registry/health";

export type RegistryHealthStatus =
  | "observing"
  | "healthy"
  | "degraded"
  | "unavailable";

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
