/**
 * What the build script and the server have to agree on: which embedding model
 * wrote the index and how its inputs are prefixed. A vector is only comparable
 * to another one from the same model, so the server refuses an index whose
 * `model` differs from `MODEL_ID`.
 *
 * `multilingual-e5-small` runs in-process on CPU (about 120 MB quantized, a few
 * milliseconds per query), so a search costs nothing and needs no API key. It
 * is multilingual: the catalog is English, queries need not be.
 */

export const MODEL_ID = "Xenova/multilingual-e5-small";
export const MODEL_DTYPE = "q8";
export const EMBEDDING_DIM = 384;

/** e5 models are trained with these prefixes; leaving them out costs recall. */
export const QUERY_PREFIX = "query: ";
export const PASSAGE_PREFIX = "passage: ";

/** Bump when the index layout or the embedded text changes. */
export const INDEX_VERSION = 1;

/** Git-ignored: written by `bun run search:build`, read by the server. */
export const SEARCH_DIR = ".search";
export const INDEX_META_FILE = "index.json";
export const INDEX_VECTORS_FILE = "index.bin";
export const MODEL_CACHE_DIR = "models";

export interface SearchIndexMeta {
  version: number;
  model: string;
  dim: number;
  /**
   * Component name per vector row. A component owns several rows: one for its
   * description and one per `askedAs` phrasing.
   */
  rows: string[];
}
