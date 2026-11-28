/**
 * Splits a search query that asks for several things at once ("end card with
 * logo, lower third name plate, screen recording in a window frame") into one
 * query per thing. Agents send whole storyboards as one query; ranked as one,
 * such a query sits close to everything and the answer is a guess. Ranked part
 * by part, every scene gets its own answer.
 *
 * `splitQuery` cuts at punctuation and at words that start a new scene, in
 * English, Russian and Chinese, and never leaves a part too short to search
 * on its own. `searchQuery` decides whether the cut stands: only for a query
 * that matches nothing well as a whole, only between parts the search ranks
 * differently, and only when the parts fit better than the whole did.
 */

import { type ComponentRecord, clampLimit } from "@/lib/mcp/search";
import {
  hybridSearch,
  type SemanticHit,
  type TopMatch,
  topMatch,
} from "@/lib/search/hybrid";

/** Characters that end a clause, Latin and CJK; a period only before a space. */
const BOUNDARY = /[,;|\n•、。，；！？!?]|\.(?=\s|$)|\s\/\s/u;

/**
 * Words that start the next scene. An alternative ("or", "или", "或") is a
 * second way to say one need, and "with" adds a detail to it, so neither cuts.
 */
const SEQUENCE_WORDS = [
  "and then",
  "followed by",
  "after that",
  "then",
  "plus",
  "and",
  "а затем",
  "а потом",
  "после этого",
  "затем",
  "потом",
  "плюс",
  "и",
];

/** Chinese has no spaces, so these cut wherever they appear. */
const SEQUENCE_WORDS_CJK = [
  "然后",
  "接着",
  "随后",
  "之后",
  "最后是",
  "最后",
  "以及",
  "并且",
];

const SEQUENCE = new RegExp(
  `\\s(?:${SEQUENCE_WORDS.join("|")})\\s|${SEQUENCE_WORDS_CJK.join("|")}`,
  "iu",
);

const LEADING_SEQUENCE = new RegExp(
  `^(?:${SEQUENCE_WORDS.join("|")})\\s+|^(?:${SEQUENCE_WORDS_CJK.join("|")})`,
  "iu",
);

/**
 * A part that only rules something out or keeps something as it is ("no
 * large zoom", "preserve readability", "без текста", "不使用箭头") constrains
 * the other parts and is not a thing to find: searched on its own, it finds
 * exactly what it rules out.
 */
const CONSTRAINT =
  /^(?:no|not|without|avoid|don['’]?t|never|keep|preserve|maintain|не|без|никаких|нет|сохран\p{L}*)(?:\s|$)|^(?:不|无|没有|避免|别|保持)/iu;

/** Words that carry a sentence but name nothing. */
const FILLER = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "for",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "into",
  "and",
  "or",
  "then",
  "some",
  "my",
  "our",
  "your",
  "we",
  "it",
  "is",
  "that",
  "this",
  "need",
  "want",
  "в",
  "на",
  "с",
  "и",
  "для",
  "по",
  "к",
  "о",
  "от",
  "из",
  "мне",
  "нужно",
  "нужен",
  "нужна",
  "хочу",
]);

/**
 * How much a part names: words that are not filler, plus one for every two
 * Chinese characters (a Chinese word is mostly two characters long).
 */
export function contentWeight(part: string): number {
  const han = part.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = (part.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).filter(
    (word) =>
      !/\p{Script=Han}/u.test(word) &&
      word.length > 1 &&
      !FILLER.has(word.toLowerCase()),
  );
  return words.length + Math.floor(han / 2);
}

/** A part has to name at least this much to be searched on its own. */
const MIN_WEIGHT = 2;

/**
 * Groups one answer shows. A query with more parts is a whole storyboard,
 * which `plan_video` handles better than a search.
 */
export const MAX_SEGMENTS = 5;

function clean(part: string): string {
  return part
    .replace(/^[\s\-–—*>:()[\]"'“”«»]+|^\d+[.)]\s+/u, "")
    .replace(LEADING_SEQUENCE, "")
    .replace(/[\s\-–—:([\]"'“”«»]+$/u, "")
    .trim();
}

function cutAt(text: string, pattern: RegExp): string[] {
  const parts: string[] = [];
  let rest = text;
  for (;;) {
    const match = pattern.exec(rest);
    if (!match) break;
    parts.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }
  parts.push(rest);
  return parts;
}

/**
 * A clause has to name this much before sequence words cut it. Described
 * needs are full of "and" and "then" that tell one component's story ("phone
 * flooded with alerts and then everything is quiet"); a run of scenes joined
 * by "and" is a long brief.
 */
const SEQUENCE_CLAUSE_WEIGHT = 10;

/**
 * Cuts at sequence words only in a long clause, and only where every side
 * names enough on its own: "fade and slide in title" stays whole.
 */
function cutAtSequenceWords(clause: string): string[] {
  if (contentWeight(clause) < SEQUENCE_CLAUSE_WEIGHT) return [clause];
  const pieces = cutAt(clause, SEQUENCE).map(clean).filter(Boolean);
  if (pieces.length < 2) return [clause];
  if (pieces.some((piece) => contentWeight(piece) < MIN_WEIGHT))
    return [clause];
  return pieces;
}

/**
 * The query's candidate parts in order. A single part means the query has
 * nowhere to cut, and it comes back exactly as typed.
 *
 * A clause that names too little to search alone ("3 seconds", "red") joins
 * the part before it; constraints are dropped.
 */
export function splitQuery(query: string): string[] {
  const text = query.trim();
  if (!text) return [];
  const parts: string[] = [];
  for (const clause of cutAt(text, BOUNDARY).map(clean)) {
    if (!clause || CONSTRAINT.test(clause)) continue;
    for (const piece of cutAtSequenceWords(clause)) {
      const previous = parts.at(-1);
      if (
        previous !== undefined &&
        (contentWeight(piece) < MIN_WEIGHT ||
          contentWeight(previous) < MIN_WEIGHT)
      ) {
        parts[parts.length - 1] = `${previous}, ${piece}`;
      } else parts.push(piece);
    }
  }
  return parts.length > 1 ? parts : [text];
}

/**
 * Two neighbouring parts are one need when any of the first `SAME_INTENT_TOP`
 * components of one is among the first of the other. Two phrasings of one
 * effect ("crossfade", "soft dissolve") draw the same components, and so do
 * two beats one component plays ("tilt a website capture in 3D", "scroll the
 * camera down a long landing page" both find `stage`). Two different scenes
 * share none.
 */
export const SAME_INTENT_TOP = 5;

function sameIntent(a: string[], b: string[]): boolean {
  const top = new Set(a.slice(0, SAME_INTENT_TOP));
  return b.slice(0, SAME_INTENT_TOP).some((name) => top.has(name));
}

/**
 * Groups of neighbouring part indexes that ask for the same thing, in order.
 * `rankings[i]` is the ranked component names for part `i`, from the
 * semantic search or, without it, from the words.
 */
export function mergeSameIntent(rankings: string[][]): number[][] {
  const groups: number[][] = [];
  rankings.forEach((ranking, index) => {
    const last = groups.at(-1);
    if (last && sameIntent(rankings[last[last.length - 1]], ranking)) {
      last.push(index);
    } else groups.push([index]);
  });
  return groups;
}

/**
 * How much better the parts have to fit, on average, than the whole query
 * did, for the answer to come in groups. Below it the parts are pieces of
 * one description rather than separate needs, and the whole query is the
 * better search. Measured on `evals/search/golden.json`.
 */
export const SPLIT_GAIN = 0.03;

/** Results per part of a split query, unless the caller asks for another number. */
const DEFAULT_SEGMENT_LIMIT = 5;

export interface SegmentSearch {
  /** The part of the query this group answers, as the query wrote it. */
  query: string;
  results: ComponentRecord[];
  /** How well the group's first result fits its part. */
  top?: TopMatch;
}

export interface CatalogSearch {
  /**
   * The answer as one list. For a split query, the groups' results taken in
   * turns (every part's best first), without repeats.
   */
  results: ComponentRecord[];
  /** `keyword` when the semantic index or model was not available. */
  mode: "hybrid" | "keyword";
  /**
   * How well the first result fits the query as a whole; `undefined` for an
   * empty query or no results. A split query keeps this score too, so it
   * stays comparable with the searches made before queries were split.
   */
  top?: TopMatch;
  /**
   * One group per thing the query asks for, in the query's order, only when
   * it asks for more than one. At most `MAX_SEGMENTS`.
   */
  segments?: SegmentSearch[];
  /** Parts past `MAX_SEGMENTS`, not searched. */
  omitted?: string[];
}

/** Semantic rankings for several queries, all or none: `semanticRankAll`. */
export type RankAll = (queries: string[]) => Promise<SemanticHit[][] | null>;

/**
 * The search behind `searchCatalog`, with the model passed in so the eval
 * and the tests run it without the server.
 *
 * The whole query is ranked first. Only when it fits nothing well is it cut
 * into parts; neighbouring parts that ask for the same thing are joined, and
 * the groups stand only if they fit better than the whole query did.
 * Otherwise the answer is the whole query's, as before splitting existed.
 */
export async function searchQuery(
  candidates: ComponentRecord[],
  query: string,
  rankAll: RankAll,
  options: { limit?: number; segmentLimit?: number } = {},
): Promise<CatalogSearch> {
  const limit = clampLimit(options.limit);
  const semantic = query ? ((await rankAll([query]))?.[0] ?? null) : null;
  const whole = hybridSearch(candidates, query, semantic, limit);
  const single: CatalogSearch = {
    results: whole,
    mode: semantic ? "hybrid" : "keyword",
    top: topMatch(query, whole[0], semantic),
  };
  if (!single.top?.weak) return single;
  const parts = splitQuery(query);
  if (parts.length < 2) return single;

  const ranked = semantic ? await rankAll(parts) : null;
  const partSemantic = parts.map((_, i) => ranked?.[i] ?? null);
  const groups = mergeSameIntent(
    parts.map((part, i) =>
      hybridSearch(candidates, part, partSemantic[i], SAME_INTENT_TOP).map(
        (record) => record.name,
      ),
    ),
  );
  if (groups.length < 2) return single;

  const shown = groups.slice(0, MAX_SEGMENTS);
  const queries = shown.map((group) => group.map((i) => parts[i]).join(", "));
  const joined = shown.flatMap((group, g) => (group.length > 1 ? [g] : []));
  const rejoined =
    ranked && joined.length > 0
      ? await rankAll(joined.map((g) => queries[g]))
      : null;
  const semanticOf = (g: number): SemanticHit[] | null =>
    shown[g].length === 1
      ? partSemantic[shown[g][0]]
      : (rejoined?.[joined.indexOf(g)] ?? null);

  const segmentLimit = clampLimit(
    options.segmentLimit ?? Math.min(limit, DEFAULT_SEGMENT_LIMIT),
  );
  const segments = queries.map((part, g): SegmentSearch => {
    const hits = semanticOf(g);
    const results = hybridSearch(candidates, part, hits, segmentLimit);
    return { query: part, results, top: topMatch(part, results[0], hits) };
  });
  const meanFit =
    segments.reduce((sum, segment) => sum + (segment.top?.score ?? 0), 0) /
    segments.length;
  if (meanFit - single.top.score < SPLIT_GAIN) return single;

  const omitted = groups
    .slice(MAX_SEGMENTS)
    .map((group) => group.map((i) => parts[i]).join(", "));
  return {
    ...single,
    results: interleave(segments.map((segment) => segment.results)).slice(
      0,
      limit,
    ),
    segments,
    ...(omitted.length > 0 ? { omitted } : {}),
  };
}

function interleave(lists: ComponentRecord[][]): ComponentRecord[] {
  const seen = new Set<string>();
  const out: ComponentRecord[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let rank = 0; rank < longest; rank++) {
    for (const list of lists) {
      const record = list[rank];
      if (record && !seen.has(record.name)) {
        seen.add(record.name);
        out.push(record);
      }
    }
  }
  return out;
}
