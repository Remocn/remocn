import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";
import {
  EMBEDDING_DIM,
  INDEX_META_FILE,
  INDEX_VECTORS_FILE,
  INDEX_VERSION,
  MODEL_CACHE_DIR,
  MODEL_DTYPE,
  MODEL_ID,
  PASSAGE_PREFIX,
  QUERY_PREFIX,
  SEARCH_DIR,
  type SearchIndexMeta,
} from "@/lib/search/model";
import { loadComponentRecords, ROOT } from "./search-records.mts";

/**
 * Embeds the component catalog for the semantic half of the search and writes
 * `.search/index.{json,bin}`. Also the step that downloads the model into
 * `.search/models`, which is where the server loads it from, so run it before
 * `next start` (the Dockerfile does). Without its output the site still
 * searches, by words only.
 *
 * A component gets one vector for what it is (title, description, `useWhen`)
 * and one per `askedAs` phrasing. The phrasings are embedded as queries: a
 * visitor's query is then compared to other queries, which the model matches
 * more tightly than a query to a long description.
 */

const BATCH = 32;

const outDir = path.join(ROOT, SEARCH_DIR);
mkdirSync(outDir, { recursive: true });
env.cacheDir = path.join(outDir, MODEL_CACHE_DIR);

const records = loadComponentRecords();
const rows: string[] = [];
const texts: string[] = [];
for (const record of records) {
  rows.push(record.name);
  texts.push(
    `${PASSAGE_PREFIX}${record.title}. ${record.description} ${record.useWhen.join(" ")}`,
  );
  for (const phrasing of record.askedAs) {
    rows.push(record.name);
    texts.push(QUERY_PREFIX + phrasing);
  }
}

const started = performance.now();
const extractor = await pipeline("feature-extraction", MODEL_ID, {
  dtype: MODEL_DTYPE,
});

const vectors = new Float32Array(texts.length * EMBEDDING_DIM);
for (let start = 0; start < texts.length; start += BATCH) {
  const output = await extractor(texts.slice(start, start + BATCH), {
    pooling: "mean",
    normalize: true,
  });
  if (output.dims.at(-1) !== EMBEDDING_DIM) {
    throw new Error(
      `${MODEL_ID} returned ${output.dims.at(-1)} dimensions, expected ${EMBEDDING_DIM}`,
    );
  }
  vectors.set(output.data as Float32Array, start * EMBEDDING_DIM);
}

const meta: SearchIndexMeta = {
  version: INDEX_VERSION,
  model: MODEL_ID,
  dim: EMBEDDING_DIM,
  rows,
};
writeFileSync(path.join(outDir, INDEX_META_FILE), JSON.stringify(meta));
writeFileSync(
  path.join(outDir, INDEX_VECTORS_FILE),
  Buffer.from(vectors.buffer, vectors.byteOffset, vectors.byteLength),
);

const seconds = ((performance.now() - started) / 1000).toFixed(1);
const megabytes = (vectors.byteLength / 1e6).toFixed(1);
console.log(
  `search index: ${records.length} components, ${rows.length} vectors, ${megabytes} MB, ${seconds}s`,
);
