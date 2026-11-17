import "server-only";

import { embedTexts } from "@/lib/search/semantic";
import { bestMatch, type PresetMatch, presetTexts } from "./match";
import type { Preset } from "./types";

/** Passage vectors by preset content, so each is embedded once per process. */
const vectors = new Map<string, Float32Array[]>();
/** Embeddings under way, so concurrent requests share them. */
const pending = new Map<string, Promise<void>>();

/**
 * How long a request waits for presets to be embedded the first time. The
 * work goes on after that and serves the next request.
 */
const FIRST_EMBED_MS = 4000;
const EMBED_LIMIT_MS = 60_000;

function embedPresets(presets: Preset[]): Promise<void> {
  const key = presets.map(cacheKey).join("\n");
  let work = pending.get(key);
  if (!work) {
    work = embedTexts(presets.flatMap(presetTexts), "passage", EMBED_LIMIT_MS)
      .then((embedded) => {
        if (!embedded) return;
        let at = 0;
        for (const preset of presets) {
          const count = presetTexts(preset).length;
          vectors.set(cacheKey(preset), embedded.slice(at, at + count));
          at += count;
        }
      })
      .finally(() => pending.delete(key));
    pending.set(key, work);
  }
  return work;
}

/**
 * The preset or mood nearest to the request in meaning, or null when the
 * embedding model is unavailable on this server.
 */
export async function matchPreset(
  text: string,
  presets: Preset[],
): Promise<PresetMatch | null> {
  if (presets.length === 0) return null;
  const missing = presets.filter((preset) => !vectors.has(cacheKey(preset)));
  if (missing.length > 0) {
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, FIRST_EMBED_MS).unref();
    });
    await Promise.race([embedPresets(missing), timeout]);
    if (missing.some((preset) => !vectors.has(cacheKey(preset)))) return null;
  }
  const [query] = (await embedTexts([text], "query")) ?? [];
  if (!query) return null;
  return bestMatch(
    query,
    presets.map((preset) => ({
      preset,
      vectors: vectors.get(cacheKey(preset)) ?? [],
    })),
  );
}

function cacheKey(preset: Preset): string {
  return JSON.stringify(presetTexts(preset));
}
