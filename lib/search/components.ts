import "server-only";

import { getCatalog } from "@/lib/mcp/catalog";
import {
  type ComponentRecord,
  clampLimit,
  filterComponents,
  type SearchOptions,
} from "@/lib/mcp/search";
import { hybridSearch, type TopMatch, topMatch } from "@/lib/search/hybrid";
import { semanticRank } from "@/lib/search/semantic";

/** Callers are public endpoints; this bounds what one request can embed. */
const MAX_QUERY_CHARS = 500;

export interface CatalogSearch {
  results: ComponentRecord[];
  /** `keyword` when the semantic index or model was not available. */
  mode: "hybrid" | "keyword";
  /** How well the first result fits; \`undefined\` for an empty query or no results. */
  top?: TopMatch;
}

/**
 * Component search for everything that runs on the server: the MCP
 * `search_components` tool and the docs search endpoint share this one entry
 * point, so both rank the same way.
 */
export async function searchCatalog(
  options: SearchOptions,
): Promise<CatalogSearch> {
  const candidates = filterComponents(getCatalog().records, options);
  const query = options.query.trim().slice(0, MAX_QUERY_CHARS);
  const semantic = query ? await semanticRank(query) : null;
  const results = hybridSearch(
    candidates,
    query,
    semantic,
    clampLimit(options.limit),
  );
  return {
    results,
    mode: semantic ? "hybrid" : "keyword",
    top: topMatch(query, results[0], semantic),
  };
}
