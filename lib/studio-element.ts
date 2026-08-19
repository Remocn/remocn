import type { StudioElementPayload } from "@remotion/studio-protocol";

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
    const mod = await import(`@/registry-artifacts/elements/${name}.json`);
    const payload = mod.default as StudioElementPayload;
    cache.set(name, payload);
    return payload;
  } catch {
    cache.set(name, null);
    return null;
  }
}
