import "server-only";

import { getCatalog } from "@/lib/mcp/catalog";
import { filterComponents, type SearchOptions } from "@/lib/mcp/search";
import { type CatalogSearch, searchQuery } from "@/lib/search/segments";
import { semanticRankAll } from "@/lib/search/semantic";

export type { CatalogSearch, SegmentSearch } from "@/lib/search/segments";

/** Callers are public endpoints; this bounds what one request can embed. */
const MAX_QUERY_CHARS = 500;

export interface CatalogSearchOptions extends SearchOptions {
  /** Results per group when the query is split; `limit` caps the flat list. */
  segmentLimit?: number;
}

/**
 * Component search for everything that runs on the server: the MCP
 * `search_components` tool and the docs search endpoint share this one entry
 * point, so both rank the same way.
 *
 * A query that asks for several things (a storyboard in one line) comes back
 * in groups, one per thing (`lib/search/segments.ts`). A query that asks for
 * one thing is searched as typed, as before.
 */
export async function searchCatalog(
  options: CatalogSearchOptions,
): Promise<CatalogSearch> {
  return searchQuery(
    filterComponents(getCatalog().records, options),
    options.query.trim().slice(0, MAX_QUERY_CHARS),
    semanticRankAll,
    { limit: options.limit, segmentLimit: options.segmentLimit },
  );
}
