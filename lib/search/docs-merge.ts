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

function wordsOverlap(a: string, b: string): boolean {
  return a === b || (a.length >= 4 && b.startsWith(a)) || a.startsWith(b);
}

/**
 * Whether the visitor is asking for this page by its title: at least half of
 * the query's words appear in it. One shared word out of seven ("show that
 * setup only takes five minutes" against the Setup guide) is a description
 * that happens to touch the title, not a request for the guide.
 */
function namesTitle(group: SortedResult[], queryWords: string[]): boolean {
  const title = group.find((r) => r.type === "page")?.content;
  if (!title || queryWords.length === 0) return false;
  const titleWords = tokenize(title.replace(/<\/?mark>/g, ""));
  const shared = queryWords.filter((word) =>
    titleWords.some((titleWord) => wordsOverlap(word, titleWord)),
  );
  return shared.length * 2 >= queryWords.length;
}

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
): SortedResult[] {
  const groups = groupByPage(docs);
  const queryWords = tokenize(query);
  const shown = new Set(components.map((c) => c.url));

  const guides: SortedResult[] = [];
  const rest: SortedResult[] = [];
  for (const [url, group] of groups) {
    if (shown.has(url)) continue;
    if (!componentUrls.has(url) && namesTitle(group, queryWords))
      guides.push(...group);
    else rest.push(...group);
  }

  const componentRows = components.flatMap((component): SortedResult[] => {
    const breadcrumbs = groups
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
  });

  return [...guides, ...componentRows, ...rest];
}
