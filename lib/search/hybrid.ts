import {
  type ComponentRecord,
  normalizeName,
  rankComponents,
  searchComponents,
  tokenize,
} from "@/lib/mcp/search";

/**
 * Pure ranking math for the hybrid component search. No I/O and no model here,
 * so it is testable with plain arrays: `lib/search/semantic.ts` supplies the
 * vectors, `lib/mcp/search.ts` the lexical ranking.
 */

/**
 * Rank constant of reciprocal rank fusion. 60 is the value from the original
 * paper; it keeps one list's top hit from drowning out a component that both
 * lists agree on.
 */
const RRF_K = 60;

/**
 * How many semantic neighbours take part in the fusion. The model always
 * returns a nearest neighbour, however far away, so the tail is noise.
 */
export const SEMANTIC_CANDIDATES = 100;

/**
 * Reciprocal rank fusion of ranked name lists, best first. A name scores
 * `1 / (k + rank)` in each list it appears in; ties keep the order of the
 * first list.
 */
export function fuseRankings(...rankings: string[][]): string[] {
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((name, index) => {
      scores.set(name, (scores.get(name) ?? 0) + 1 / (RRF_K + index + 1));
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

export interface SemanticHit {
  name: string;
  /** Cosine similarity of the query to the component's closest vector. */
  score: number;
}

/**
 * Best row per component, best component first. `vectors` holds `rows.length`
 * unit vectors of `dim` floats back to back, so the dot product is the cosine.
 */
export function rankByVectors(
  query: Float32Array,
  vectors: Float32Array,
  rows: string[],
  dim: number,
): SemanticHit[] {
  const best = new Map<string, number>();
  for (let row = 0; row < rows.length; row++) {
    const offset = row * dim;
    let dot = 0;
    for (let i = 0; i < dim; i++) dot += query[i] * vectors[offset + i];
    const name = rows[row];
    const previous = best.get(name);
    if (previous === undefined || dot > previous) best.set(name, dot);
  }
  return [...best.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/**
 * The component search: candidates ranked by meaning and by words, fused.
 *
 * `semantic` is `null` when the index or the model is not available; the
 * search then degrades to the keyword ranking instead of failing. The two
 * halves cover each other: words pin down an exact name (`typewriter`) that
 * the model may place below a look-alike, meaning finds a need phrased in
 * words the catalog never uses, in any language.
 */
export function hybridSearch(
  candidates: ComponentRecord[],
  query: string,
  semantic: SemanticHit[] | null,
  limit: number,
): ComponentRecord[] {
  if (!semantic || query.trim() === "") {
    return searchComponents(candidates, { query, limit });
  }
  const byName = new Map(candidates.map((record) => [record.name, record]));
  const byMeaning = semantic
    .filter((hit) => byName.has(hit.name))
    .slice(0, SEMANTIC_CANDIDATES)
    .map((hit) => hit.name);
  const byWords = rankComponents(candidates, query).map((r) => r.record.name);

  const named = namedComponents(candidates, query, byWords);
  const fused = fuseRankings(byMeaning, byWords).filter(
    (name) => !named.includes(name),
  );

  return [...named, ...fused]
    .slice(0, limit)
    .flatMap((name) => byName.get(name) ?? []);
}

/**
 * Components the query calls by name, in keyword order. A query like
 * `typewriter headline` is a lookup, not a description, and the model is at
 * its weakest on two bare words: without this rule the named component sinks
 * below look-alikes that both rankings happen to agree on.
 *
 * A name counts as called when every part of it is a word of the query and it
 * makes up at least half of the query. The share keeps a common noun in a
 * long description ("... when a button gets pressed") from pinning `button`.
 */
function namedComponents(
  candidates: ComponentRecord[],
  query: string,
  byWords: string[],
): string[] {
  const words = tokenize(query);
  const exact = normalizeName(query);
  const named = candidates
    .filter((record) => {
      if (record.name === exact) return true;
      const parts = record.name.split("-");
      return (
        parts.every((part) => words.includes(part)) &&
        parts.length * 2 >= words.length
      );
    })
    .map((record) => record.name);
  const order = (name: string) => {
    if (name === exact) return -1;
    const index = byWords.indexOf(name);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  return named.sort((a, b) => order(a) - order(b));
}
