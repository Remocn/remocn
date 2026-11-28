import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";
import {
  hybridSearch,
  rankByVectors,
  type SemanticHit,
} from "@/lib/search/hybrid";
import {
  INDEX_META_FILE,
  INDEX_VECTORS_FILE,
  MODEL_CACHE_DIR,
  MODEL_DTYPE,
  MODEL_ID,
  QUERY_PREFIX,
  SEARCH_DIR,
  type SearchIndexMeta,
} from "@/lib/search/model";
import { type CatalogSearch, searchQuery } from "@/lib/search/segments";
import { loadComponentRecords, ROOT } from "./search-records.mts";

/**
 * Scores the component search against `evals/search/golden.json`: described
 * needs in English and Russian plus name and keyword lookups, each with the
 * component (or interchangeable components) it should surface. The two kinds
 * pull in opposite directions (meaning helps the first, exact words the
 * second), so a ranking change has to hold up on both. Prints how often the
 * expected component lands in the top 1, 5 and 10 for the keyword ranking
 * alone and for the hybrid ranking, then lists the hybrid misses. Run
 * `bun run search:build` first.
 *
 * Both rankings run through `searchQuery`, the search the server runs, so a
 * single-need query that gets split by mistake shows up as a loss here, and
 * the run lists every such query.
 *
 * Briefs (`kind: "brief"`) ask for several things in one query, as agents
 * send whole storyboards. Each expected part is scored twice: by its rank in
 * the whole query's ranking (the search before briefs were split) and by its
 * rank inside the group the split answer gives it. Parts the catalog lacks
 * (`gap: true`) count whether their group is flagged weak.
 *
 * A golden query names one right answer in a catalog full of near siblings, so
 * a miss is sometimes a different component that fits just as well. Read the
 * numbers as a comparison between rankings, not as an absolute hit rate.
 */

interface GoldenPart {
  expect?: string[];
  /** The catalog has nothing for this part; its group should read as weak. */
  gap?: boolean;
  /** Words of the query this part is, to find its group: required with `gap`. */
  part?: string;
  note?: string;
}

interface GoldenQuery {
  query: string;
  expect?: string[];
  /** `ru` or `zh` for a non-English need; the catalog itself is English. */
  lang?: string;
  /** `keyword` for a name or two bare words, `brief` for several needs. */
  kind?: string;
  /** `agent` for a query an agent sent to the MCP server. */
  source?: string;
  parts?: GoldenPart[];
}

const TOP = 10;

const dir = path.join(ROOT, SEARCH_DIR);
const metaPath = path.join(dir, INDEX_META_FILE);
if (!existsSync(metaPath)) {
  console.error("No search index. Run `bun run search:build` first.");
  process.exit(1);
}
const meta = JSON.parse(readFileSync(metaPath, "utf8")) as SearchIndexMeta;
const file = readFileSync(path.join(dir, INDEX_VECTORS_FILE));
const vectors = new Float32Array(
  file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
);

env.cacheDir = path.join(dir, MODEL_CACHE_DIR);
env.allowRemoteModels = false;
const extractor = await pipeline("feature-extraction", MODEL_ID, {
  dtype: MODEL_DTYPE,
});

async function rankAll(queries: string[]): Promise<SemanticHit[][]> {
  const out: SemanticHit[][] = [];
  for (const query of queries) {
    const output = await extractor(QUERY_PREFIX + query, {
      pooling: "mean",
      normalize: true,
    });
    out.push(
      rankByVectors(output.data as Float32Array, vectors, meta.rows, meta.dim),
    );
  }
  return out;
}
const noModel = async () => null;

const records = loadComponentRecords();
const golden = JSON.parse(
  readFileSync(path.join(ROOT, "evals/search/golden.json"), "utf8"),
) as GoldenQuery[];
const needs = golden.filter((entry) => entry.kind !== "brief");
const briefs = golden.filter((entry) => entry.kind === "brief");

function rankOf(names: string[], expect: string[]): number {
  const index = names.findIndex((name) => expect.includes(name));
  return index === -1 ? Number.POSITIVE_INFINITY : index + 1;
}

const names = (search: CatalogSearch) => search.results.map((r) => r.name);

function share(ranks: number[], k: number): string {
  const hit = ranks.filter((r) => r <= k).length;
  return `${Math.round((hit / Math.max(1, ranks.length)) * 100)}%`.padStart(4);
}

function report(label: string, ranks: number[]) {
  console.log(
    `${label.padEnd(22)} top1 ${share(ranks, 1)}   top5 ${share(ranks, 5)}   top10 ${share(ranks, 10)}`,
  );
}

const rows: {
  golden: GoldenQuery;
  keyword: number;
  hybrid: number;
  top: string[];
  split: boolean;
}[] = [];
for (const entry of needs) {
  const expect = entry.expect ?? [];
  const keyword = await searchQuery(records, entry.query, noModel, {
    limit: TOP,
  });
  const hybrid = await searchQuery(records, entry.query, rankAll, {
    limit: TOP,
  });
  rows.push({
    golden: entry,
    keyword: rankOf(names(keyword), expect),
    hybrid: rankOf(names(hybrid), expect),
    top: names(hybrid).slice(0, 3),
    split: Boolean(hybrid.segments || keyword.segments),
  });
}

const groupOf = (entry: GoldenQuery) =>
  entry.kind ?? `described need, ${entry.lang ?? "en"}`;
for (const group of new Set(needs.map(groupOf))) {
  const subset = rows.filter((r) => groupOf(r.golden) === group);
  console.log(`\n${group} (${subset.length} queries)`);
  report(
    "  keyword only",
    subset.map((r) => r.keyword),
  );
  report(
    "  hybrid",
    subset.map((r) => r.hybrid),
  );
}

const split = rows.filter((r) => r.split);
console.log(`\nsingle-need queries answered in groups: ${split.length}`);
for (const row of split) console.log(`  "${row.golden.query}"`);

interface PartScore {
  whole: number;
  grouped: number;
  gap: boolean;
  weak: boolean;
}

/**
 * Where a part's component lands: in the whole query's ranking, and inside
 * the group of the split answer that ranks it best (the whole ranking again
 * when the answer was not split).
 */
function scoreParts(
  entry: GoldenQuery,
  whole: string[],
  answer: CatalogSearch,
): PartScore[] {
  const groups = answer.segments ?? [
    { query: entry.query, results: answer.results, top: answer.top },
  ];
  return (entry.parts ?? []).map((part) => {
    const expect = part.expect ?? [];
    const ranks = groups.map((g) =>
      rankOf(
        g.results.map((r) => r.name),
        expect,
      ),
    );
    const best = Math.min(...ranks);
    const at = ranks.indexOf(best);
    return {
      whole: rankOf(whole, expect),
      grouped: best,
      gap: Boolean(part.gap),
      weak: part.gap
        ? Boolean(
            groups.find((g) => part.part && g.query.includes(part.part))?.top
              ?.weak,
          )
        : Boolean(groups[at]?.top?.weak),
    };
  });
}

console.log(`\nbriefs (${briefs.length} queries)`);
for (const [label, rank] of [
  ["hybrid", rankAll],
  ["keyword only", noModel],
] as const) {
  const parts: PartScore[] = [];
  let answered = 0;
  let weakWhole = 0;
  let segments = 0;
  let weakSegments = 0;
  for (const entry of briefs) {
    const whole = await searchQuery(records, entry.query, rank, {
      limit: TOP,
      segmentLimit: TOP,
    });
    const wholeNames = whole.segments
      ? (await searchWhole(entry.query, rank)).map((r) => r.name)
      : names(whole);
    parts.push(...scoreParts(entry, wholeNames, whole));
    if (whole.top?.weak) weakWhole++;
    if (whole.segments) {
      answered++;
      segments += whole.segments.length;
      weakSegments += whole.segments.filter((s) => s.top?.weak).length;
    }
  }
  const found = parts.filter((p) => !p.gap);
  const gaps = parts.filter((p) => p.gap);
  console.log(
    `  ${label}: ${answered} of ${briefs.length} answered in groups, ${segments} groups, ${weakSegments} weak; whole query weak in ${weakWhole}`,
  );
  report(
    "    whole query",
    found.map((p) => p.whole),
  );
  report(
    "    grouped",
    found.map((p) => p.grouped),
  );
  if (gaps.length)
    console.log(
      `    catalog gaps flagged weak: ${gaps.filter((p) => p.weak).length} of ${gaps.length}`,
    );
}

/** The whole query ranked once, as the search did before briefs were split. */
async function searchWhole(
  query: string,
  rank: typeof rankAll | typeof noModel,
) {
  const semantic = (await rank([query]))?.[0] ?? null;
  return hybridSearch(records, query, semantic, TOP);
}

const misses = rows.filter((r) => r.hybrid > 5);
console.log(`\nhybrid misses outside the top 5: ${misses.length}`);
for (const miss of misses) {
  const rank = Number.isFinite(miss.hybrid)
    ? `rank ${miss.hybrid}`
    : "not in top 10";
  console.log(
    `  "${miss.golden.query}"\n    expected ${miss.golden.expect?.[0]} (${rank}), got ${miss.top.join(", ")}`,
  );
}

console.log("\nbriefs, hybrid groups:");
for (const entry of briefs) {
  const answer = await searchQuery(records, entry.query, rankAll, {
    limit: TOP,
  });
  console.log(`  "${entry.query.slice(0, 90)}"`);
  for (const segment of answer.segments ?? []) {
    const score = segment.top ? segment.top.score.toFixed(2) : "—";
    console.log(
      `    [${segment.query.slice(0, 60)}] ${score}${segment.top?.weak ? " weak" : ""}: ${segment.results
        .slice(0, 3)
        .map((r) => r.name)
        .join(", ")}`,
    );
  }
  if (!answer.segments) console.log("    (answered whole)");
}
