import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { rankByVectors, type SemanticHit } from "@/lib/search/hybrid";
import {
  INDEX_META_FILE,
  INDEX_VECTORS_FILE,
  INDEX_VERSION,
  MODEL_CACHE_DIR,
  MODEL_DTYPE,
  MODEL_ID,
  QUERY_PREFIX,
  SEARCH_DIR,
  type SearchIndexMeta,
} from "@/lib/search/model";

/**
 * The semantic half of the component search: a query is embedded by a small
 * model running in this process and compared against vectors that
 * `bun run search:build` wrote ahead of time.
 *
 * Everything here is optional. With no index on disk (a fresh checkout that
 * never ran the build), a model that fails to load, or a model that is still
 * loading, `semanticRank` resolves to `null` and the caller ranks by words
 * alone.
 */

interface LoadedIndex {
  rows: string[];
  dim: number;
  vectors: Float32Array;
}

type Embed = (text: string) => Promise<Float32Array>;

/** A cold model takes seconds to load; a request should not wait for it. */
const EMBED_TIMEOUT_MS = 800;

let index: LoadedIndex | null | undefined;
let embedder: Promise<Embed | null> | undefined;

function searchDir(): string {
  return join(process.cwd(), SEARCH_DIR);
}

function loadIndex(): LoadedIndex | null {
  if (index !== undefined) return index;
  index = null;
  const metaPath = join(searchDir(), INDEX_META_FILE);
  const vectorsPath = join(searchDir(), INDEX_VECTORS_FILE);
  if (!existsSync(metaPath) || !existsSync(vectorsPath)) return index;
  try {
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as SearchIndexMeta;
    if (meta.version !== INDEX_VERSION || meta.model !== MODEL_ID) {
      console.warn(
        "[search] the index was built for another model or layout; run `bun run search:build`. Falling back to keyword search.",
      );
      return index;
    }
    const file = readFileSync(vectorsPath);
    // Copy into a fresh buffer: a Buffer may start at an offset that is not a
    // multiple of four, which a Float32Array view cannot sit on.
    const vectors = new Float32Array(
      file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    );
    if (vectors.length !== meta.rows.length * meta.dim) {
      console.warn(
        "[search] the index is truncated; run `bun run search:build`.",
      );
      return index;
    }
    index = { rows: meta.rows, dim: meta.dim, vectors };
  } catch (error) {
    console.warn("[search] could not read the index:", error);
  }
  return index;
}

function loadEmbedder(): Promise<Embed | null> {
  embedder ??= (async () => {
    try {
      const { env, pipeline } = await import("@huggingface/transformers");
      // The build step downloads the model next to the index. The server only
      // ever reads it from there and never reaches out to the network.
      env.cacheDir = join(searchDir(), MODEL_CACHE_DIR);
      env.allowRemoteModels = false;
      const extractor = await pipeline("feature-extraction", MODEL_ID, {
        dtype: MODEL_DTYPE,
      });
      return async (text: string) => {
        const output = await extractor(QUERY_PREFIX + text, {
          pooling: "mean",
          normalize: true,
        });
        return output.data as Float32Array;
      };
    } catch (error) {
      console.warn(
        "[search] the embedding model did not load; using keyword search only:",
        error,
      );
      return null;
    }
  })();
  return embedder;
}

/**
 * Components ordered by how close they are to the query in meaning, or `null`
 * when the semantic index is not available for this request.
 */
export async function semanticRank(
  query: string,
): Promise<SemanticHit[] | null> {
  const loaded = loadIndex();
  if (!loaded) return null;

  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), EMBED_TIMEOUT_MS).unref();
  });
  const vector = await Promise.race([
    loadEmbedder().then((embed) => (embed ? embed(query) : null)),
    timeout,
  ]).catch(() => null);
  if (!vector) return null;

  return rankByVectors(vector, loaded.vectors, loaded.rows, loaded.dim);
}
