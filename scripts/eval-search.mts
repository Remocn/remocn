import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";
import { searchComponents } from "@/lib/mcp/search";
import { hybridSearch, rankByVectors } from "@/lib/search/hybrid";
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
import { loadComponentRecords, ROOT } from "./search-records.mts";

/**
 * Scores the component search against `evals/search/golden.json`: described
 * needs in English and Russian plus name and keyword lookups, each with the
 * component (or interchangeable components) it should surface. The two kinds
 * pull in opposite directions (meaning helps the first, exact words the
 * second), so a ranking change has to hold up on both. Prints how often the expected component lands in the top 1, 5 and
 * 10 for the keyword ranking alone and for the hybrid ranking, then lists the
 * hybrid misses. Run `bun run search:build` first.
 *
 * A golden query names one right answer in a catalog full of near siblings, so
 * a miss is sometimes a different component that fits just as well. Read the
 * numbers as a comparison between rankings, not as an absolute hit rate.
 */

interface GoldenQuery {
  query: string;
  expect: string[];
  /** `ru` for a non-English need; the catalog itself is English. */
  lang?: string;
  /** `keyword` for a name or two bare words rather than a described need. */
  kind?: string;
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

const records = loadComponentRecords();
const golden = JSON.parse(
  readFileSync(path.join(ROOT, "evals/search/golden.json"), "utf8"),
) as GoldenQuery[];

function rankOf(names: string[], expect: string[]): number {
  const index = names.findIndex((name) => expect.includes(name));
  return index === -1 ? Number.POSITIVE_INFINITY : index + 1;
}

const rows: {
  golden: GoldenQuery;
  keyword: number;
  hybrid: number;
  top: string[];
}[] = [];
for (const entry of golden) {
  const output = await extractor(QUERY_PREFIX + entry.query, {
    pooling: "mean",
    normalize: true,
  });
  const semantic = rankByVectors(
    output.data as Float32Array,
    vectors,
    meta.rows,
    meta.dim,
  );
  const keyword = searchComponents(records, { query: entry.query, limit: TOP });
  const hybrid = hybridSearch(records, entry.query, semantic, TOP);
  rows.push({
    golden: entry,
    keyword: rankOf(
      keyword.map((r) => r.name),
      entry.expect,
    ),
    hybrid: rankOf(
      hybrid.map((r) => r.name),
      entry.expect,
    ),
    top: hybrid.slice(0, 3).map((r) => r.name),
  });
}

function report(label: string, ranks: number[]) {
  const share = (k: number) =>
    `${Math.round((ranks.filter((r) => r <= k).length / ranks.length) * 100)}%`.padStart(
      4,
    );
  console.log(
    `${label.padEnd(22)} top1 ${share(1)}   top5 ${share(5)}   top10 ${share(10)}`,
  );
}

const groupOf = (entry: GoldenQuery) =>
  entry.kind ?? `described need, ${entry.lang ?? "en"}`;
for (const group of new Set(golden.map(groupOf))) {
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

const misses = rows.filter((r) => r.hybrid > 5);
console.log(`\nhybrid misses outside the top 5: ${misses.length}`);
for (const miss of misses) {
  const rank = Number.isFinite(miss.hybrid)
    ? `rank ${miss.hybrid}`
    : "not in top 10";
  console.log(
    `  "${miss.golden.query}"\n    expected ${miss.golden.expect[0]} (${rank}), got ${miss.top.join(", ")}`,
  );
}
