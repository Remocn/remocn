import type { SortedResult } from "fumadocs-core/search";
import { tokenize } from "@/lib/mcp/search";

/**
 * Puts component matches into the docs search results, which the search
 * dialog renders as a flat list of pages with their matched lines underneath.
 * Pure, so the ordering is testable without the search servers.
 */

export interface ComponentHit {
  name: string;
  title: string;
  description: string;
  /** Site-relative docs URL of the component page. */
  url: string;
  /** Docs section the page sits in, shown as its breadcrumb. */
  section: string;
}

function pageUrl(url: string): string {
  return url.split("#")[0];
}

/** Full-text results arrive as a page row followed by its matched lines. */
function groupByPage(results: SortedResult[]): Map<string, SortedResult[]> {
  const groups = new Map<string, SortedResult[]>();
  for (const result of results) {
    const key = pageUrl(result.url);
    const group = groups.get(key);
    if (group) group.push(result);
    else groups.set(key, [result]);
  }
  return groups;
}

/**
 * Words that carry a sentence but name nothing. People now describe what they
 * need ("i need to show my contribution"), and the full-text search would
 * otherwise match the letter "i" on every page.
 */
const FUNCTION_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "our",
  "some",
  "something",
  "that",
  "the",
  "this",
  "to",
  "want",
  "we",
  "what",
  "with",
  "you",
  "your",
]);

/**
 * The query the full-text search should run: the same words without the
 * function words and stray single letters. A query made only of those is
 * passed through as typed.
 */
export function fullTextQuery(query: string): string {
  const kept = query
    .trim()
    .split(/\s+/)
    .filter((word) => {
      const bare = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
      return !FUNCTION_WORDS.has(bare) && !/^[a-z0-9]?$/.test(bare);
    });
  return kept.length > 0 ? kept.join(" ") : query;
}

function wordsOverlap(a: string, b: string): boolean {
  return a === b || (a.length >= 4 && b.startsWith(a)) || a.startsWith(b);
}

/**
 * Whether the visitor is asking for this page by its title: every word of the
 * query, function words aside, appears in it ("installation", "how to
 * install", "mcp server"). One shared word is not enough: "i need show my
 * contribution" touches "Showcase reel" through "show", and is a described
 * need, not a request for that guide.
 */
function namesTitle(group: SortedResult[], queryWords: string[]): boolean {
  const title = group.find((r) => r.type === "page")?.content;
  if (!title || queryWords.length === 0) return false;
  const titleWords = tokenize(title.replace(/<\/?mark>/g, ""));
  return queryWords.every((word) =>
    titleWords.some((titleWord) => wordsOverlap(word, titleWord)),
  );
}

/** Matched lines shown under a guide that leads the results. */
const GUIDE_LINES = 2;

function sectionLabel(slug: string): string {
  return slug.replace(/(^|-)([a-z])/g, (_, sep: string, c: string) =>
    (sep ? " " : "").concat(c.toUpperCase()),
  );
}

/**
 * Order: guides the query names by title, then the components that fit the
 * need, then every other full-text match.
 *
 * A guide the visitor named ("installation", "mcp") must not sink below
 * components, because the component search always returns its nearest
 * neighbours, relevant or not. Components come before the remaining text
 * matches because a need-style query ("show revenue growing") rarely shares
 * words with any page, and the text matches for it are incidental.
 */
export function mergeDocsResults(
  query: string,
  docs: SortedResult[],
  components: ComponentHit[],
  componentUrls: ReadonlySet<string>,
  groups?: ComponentGroup[],
): SortedResult[] {
  const pagesByUrl = groupByPage(docs);
  const queryWords = tokenize(query).filter(
    (word) => !FUNCTION_WORDS.has(word),
  );
  const shown = new Set(components.map((c) => c.url));

  const guides: SortedResult[] = [];
  const rest: SortedResult[] = [];
  for (const [url, group] of pagesByUrl) {
    if (shown.has(url)) continue;
    if (!componentUrls.has(url) && namesTitle(group, queryWords)) {
      // A long guide matches on dozens of lines; all of them above the
      // components would push every component off the first screen.
      const lines = group.filter((r) => r.type !== "page");
      guides.push(
        ...group.filter((r) => r.type === "page"),
        ...lines.slice(0, GUIDE_LINES),
      );
    } else rest.push(...group);
  }

  const componentRow = (component: ComponentHit): SortedResult[] => {
    const breadcrumbs = pagesByUrl
      .get(component.url)
      ?.find((r) => r.type === "page")?.breadcrumbs ?? [
      sectionLabel(component.section),
    ];
    return [
      {
        id: `component:${component.name}`,
        url: component.url,
        type: "page",
        content: component.title,
        breadcrumbs,
      },
      {
        id: `component:${component.name}:description`,
        url: component.url,
        type: "text",
        content: component.description,
      },
    ];
  };
  const componentRows = groups
    ? groupedRows(groups).flatMap((row) =>
        "hit" in row ? componentRow(row.hit) : [row],
      )
    : components.flatMap(componentRow);

  return [...guides, ...componentRows, ...rest];
}

/** Components that answer one part of a query split into parts. */
export interface ComponentGroup {
  /** The part of the query, shown above its components. */
  query: string;
  hits: ComponentHit[];
}

export const SEGMENT_ID = "segment:";

/**
 * A heading row per group, then its components. A component already shown
 * under an earlier group is not repeated, and a group left with none is
 * dropped. The heading is a `heading` row pointing at its first component,
 * so a client that renders fumadocs results as they come still shows it
 * sensibly; the docs dialog turns it into a label (`splitSegmentRows`).
 */
function groupedRows(
  groups: ComponentGroup[],
): (SortedResult | { hit: ComponentHit })[] {
  const seen = new Set<string>();
  return groups.flatMap((group, index) => {
    const hits = group.hits.filter((hit) => !seen.has(hit.url));
    for (const hit of hits) seen.add(hit.url);
    if (hits.length === 0) return [];
    return [
      {
        id: `${SEGMENT_ID}${index}`,
        url: hits[0].url,
        type: "heading" as const,
        content: group.query,
      },
      ...hits.map((hit) => ({ hit })),
    ];
  });
}

/**
 * The dialog's view of grouped results: the rows to list, without the group
 * headings, and each heading's text keyed by the row it stands above. A
 * heading is a label, not a result, so keyboard navigation and selection
 * skip it.
 */
export function splitSegmentRows<T extends { id: string; content: unknown }>(
  rows: T[],
): { items: T[]; headings: Map<string, string> } {
  const items: T[] = [];
  const headings = new Map<string, string>();
  let pending: string | undefined;
  for (const row of rows) {
    if (row.id.startsWith(SEGMENT_ID)) {
      pending = String(row.content);
      continue;
    }
    if (pending !== undefined) headings.set(row.id, pending);
    pending = undefined;
    items.push(row);
  }
  return { items, headings };
}
