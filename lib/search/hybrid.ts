import {
  type ComponentRecord,
  normalizeName,
  queryCoverage,
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
    .filter((record) => callsByName(record, words, exact))
    .map((record) => record.name);
  const order = (name: string) => {
    if (name === exact) return -1;
    const index = byWords.indexOf(name);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  return named.sort((a, b) => order(a) - order(b));
}

function callsByName(
  record: ComponentRecord,
  words: string[],
  exact: string,
): boolean {
  if (record.name === exact) return true;
  const parts = record.name.split("-");
  return (
    parts.every((part) => words.includes(part)) &&
    parts.length * 2 >= words.length
  );
}

/**
 * Below this a search counts as weak: the catalog most likely has nothing
 * for the need. One value per mode, because the scores are not comparable.
 * Measured on `evals/search/golden.json`, the catalog gaps from the agent
 * queries of November 2026 (lower third, Ken Burns, dip to black) and a
 * sample of real agent queries; the numbers are in the PR that added them.
 */
export const WEAK_BELOW = { hybrid: 0.3, keyword: 0.5 } as const;

export interface TopMatch {
  /** 0 to 1; 1 when the query calls the component by name. */
  score: number;
  weak: boolean;
}

/**
 * How well the first result fits the query. The fused ranking is made of
 * ranks, so it always has a first place and says nothing about distance; the
 * score is read from the half that measures distance.
 *
 * With semantic hits: how far the result's cosine stands above the median
 * component's, as a share of the room left above that median. e5 puts every
 * component within a narrow band of cosines whose floor moves with the query
 * (a long description is close to everything), so the raw cosine of the top
 * hit tells a gap from a match worse than its lift above the floor. Without
 * them: the share of the query's words the result matches.
 *
 * `undefined` for an empty query, which lists the catalog rather than
 * searching it, and when nothing came back.
 */
export function topMatch(
  query: string,
  top: ComponentRecord | undefined,
  semantic: SemanticHit[] | null,
): TopMatch | undefined {
  if (!top || query.trim() === "") return undefined;
  const words = tokenize(query);
  const mode = semantic ? "hybrid" : "keyword";
  let score: number;
  if (callsByName(top, words, normalizeName(query))) score = 1;
  else if (semantic) score = semanticLift(top.name, semantic);
  else score = queryCoverage(top, words);
  return { score, weak: score < WEAK_BELOW[mode] };
}

function semanticLift(name: string, semantic: SemanticHit[]): number {
  const cosine = semantic.find((hit) => hit.name === name)?.score;
  if (cosine === undefined || semantic.length === 0) return 0;
  const median = semantic[Math.floor(semantic.length / 2)].score;
  if (median >= 1) return 0;
  return Math.min(1, Math.max(0, (cosine - median) / (1 - median)));
}
