import { createFromSource } from "fumadocs-core/search/server";
import { docsSearchIndex } from "@/lib/docs-search-index";
import { getCatalog } from "@/lib/mcp/catalog";
import type { ComponentRecord } from "@/lib/mcp/search";
import { searchCatalog } from "@/lib/search/components";
import {
  type ComponentHit,
  fullTextQuery,
  mergeDocsResults,
} from "@/lib/search/docs-merge";
import { trackAgentSearch } from "@/lib/server/analytics";
import { source } from "@/source";

const docsSearch = createFromSource(source, {
  buildIndex: docsSearchIndex,
});

/** How many components lead the results of the docs search dialog. */
const COMPONENT_RESULTS = 6;

/**
 * Components under each part when a query asks for several things. Five
 * parts of three fill the dialog's first screens without burying the docs
 * matches below them.
 */
const SEGMENT_RESULTS = 3;

let componentUrls: Set<string> | undefined;

/**
 * The docs search: full-text matches from fumadocs, with the components that
 * fit the query by meaning placed among them. A query that asks for several
 * things gets its components in groups, one per part, under a heading row. The response keeps the fumadocs
 * shape, so the stock search dialog renders it unchanged.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  if (!query) return Response.json([]);

  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    url.searchParams.has("limit") && Number.isInteger(limitParam)
      ? limitParam
      : undefined;
  const tag = url.searchParams.get("tag")?.split(",");

  const catalog = getCatalog();
  const started = performance.now();
  const [docs, { results, mode, top, segments }] = await Promise.all([
    docsSearch.search(fullTextQuery(query), {
      tag,
      locale: url.searchParams.get("locale") ?? undefined,
      limit,
    }),
    // A tag narrows the search to one slice of the docs; the component
    // ranking knows nothing about tags, so it stays out of a tagged search.
    tag
      ? { results: [], mode: undefined, top: undefined, segments: undefined }
      : searchCatalog({
          query,
          limit: COMPONENT_RESULTS,
          segmentLimit: SEGMENT_RESULTS,
        }),
  ]);
  // A split query answers with every group's components, not only the
  // interleaved first few, so the flat list is the groups' union.
  const components = segments
    ? segments.flatMap((segment) => segment.results)
    : results;

  // The search dialog reports its own searches from the browser, where it
  // knows which ones the visitor settled on and what they opened. Any other
  // caller is a program using the documented API, and is counted here.
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    trackAgentSearch({
      surface: "api",
      userAgent: request.headers.get("user-agent") ?? "",
      query,
      results: components.map((record) => record.name),
      mode,
      top,
      segments,
      latencyMs: performance.now() - started,
    });
  }

  const toHits = (records: ComponentRecord[]) =>
    records.flatMap((record): ComponentHit[] => {
      const page = catalog.pages.get(record.name);
      return page
        ? [
            {
              name: record.name,
              title: record.title,
              description: record.description,
              url: page.url,
              section: record.section,
            },
          ]
        : [];
    });
  componentUrls ??= new Set([...catalog.pages.values()].map((p) => p.url));

  const merged = mergeDocsResults(
    query,
    docs,
    toHits(components),
    componentUrls,
    segments?.map((segment) => ({
      query: segment.query,
      hits: toHits(segment.results),
    })),
  );
  return Response.json(limit === undefined ? merged : merged.slice(0, limit));
}
