import type { Preset } from "./types";

export interface PresetVectors {
  preset: Preset;
  /** The description and each `askedAs` phrasing, normalized. */
  vectors: Float32Array[];
}

export interface PresetMatch {
  preset: Preset;
  score: number;
}

function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * The preset closest in meaning to the request: the best cosine over each
 * preset's phrasings. Vectors are normalized, so cosine is a dot product.
 */
export function bestMatch(
  query: Float32Array,
  candidates: PresetVectors[],
): PresetMatch | null {
  let best: PresetMatch | null = null;
  for (const { preset, vectors } of candidates) {
    for (const vector of vectors) {
      const score = dot(query, vector);
      if (!best || score > best.score) best = { preset, score };
    }
  }
  return best;
}

/** What a preset is embedded as. */
export function presetTexts(preset: Preset): string[] {
  return [`${preset.label}. ${preset.description}`, ...preset.askedAs];
}
