const number = new Intl.NumberFormat("en-US");
const ratio = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const weekdayDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export const formatNumber = (value: number) => number.format(value);

export const formatRatio = (value: number) => ratio.format(value);

/** OpenPanel days come as `YYYY-MM-DD`, sometimes with a time part. */
function parseDay(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Sep 24" */
export function formatDay(value: string) {
  const date = parseDay(value);
  return date ? shortDate.format(date) : value;
}

/** "Sun, Oct 18" */
export function formatWeekday(value: string) {
  const date = parseDay(value);
  return date ? weekdayDate.format(date) : value;
}

/** 475 → "7m 55s" */
export function formatDuration(totalSeconds: number) {
  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** ISO 3166 code → English name ("US" → "United States"). */
export function formatCountry(code: string) {
  try {
    return countryNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
