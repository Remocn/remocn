/**
 * Requests per visitor per minute, in memory: the endpoint embeds every
 * request, so even the free tiers are worth shielding from a flood. One
 * container serves the site, so one process sees every request.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;

export function withinBurst(
  client: string,
  limit: number,
  now = Date.now(),
): boolean {
  const times = (recent.get(client) ?? []).filter((at) => now - at < WINDOW_MS);
  times.push(now);
  recent.set(client, times);
  if (recent.size > 10_000) {
    for (const [key, list] of recent) {
      if (list.every((at) => now - at >= WINDOW_MS)) recent.delete(key);
    }
  }
  return times.length <= limit;
}
