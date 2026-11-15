import type { StudioElementPayload } from "@remotion/studio-protocol";

// `null` = the item has no payload (404). Network failures are not cached so
// the next attempt retries.
const cache = new Map<string, StudioElementPayload | null>();

export function getCachedStudioElement(
  name: string,
): StudioElementPayload | null {
  return cache.get(name) ?? null;
}

export async function loadStudioElement(
  name: string,
): Promise<StudioElementPayload | null> {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  try {
    // Fetched, not `import()`ed: a dynamic import over the elements folder
    // compiles all 600+ payloads into the bundle (see app/r/elements).
    const res = await fetch(`/r/elements/${encodeURIComponent(name)}.json`);
    if (res.status === 404) {
      cache.set(name, null);
      return null;
    }
    if (!res.ok) return null;
    const payload = (await res.json()) as StudioElementPayload;
    cache.set(name, payload);
    return payload;
  } catch {
    return null;
  }
}
