import {
  findNeighbour,
  findPath,
  flattenTree,
  type Item,
  type Node,
} from "fumadocs-core/page-tree";
import { DOCS_TABS, getActiveDocsTab, splitDocsTree } from "@/lib/docs-tabs";
import { source } from "@/source";

export type Crumb = { label: string; href?: string };

export type PageNeighbour = { name: string; url: string };

export type PageContext = {
  crumbs: Crumb[];
  previous?: PageNeighbour;
  next?: PageNeighbour;
};

const label = (node: Node | Item): string =>
  typeof node.name === "string" ? node.name : "";

/** A folder's landing page: its `index`, or the child every sibling nests under. */
function folderHref(folder: Node): string | undefined {
  if (folder.type !== "folder") return undefined;
  if (folder.index) return folder.index.url;
  const pages = folder.children.filter((n): n is Item => n.type === "page");
  return pages.find((p) => pages.every((o) => o.url.startsWith(p.url)))?.url;
}

const toNeighbour = (item?: Item): PageNeighbour | undefined =>
  item ? { name: label(item), url: item.url } : undefined;

/**
 * Breadcrumb and prev/next for a docs page, both scoped to the page's own
 * library tree (the same split the sidebar shows), so neighbours never jump
 * into another library. Pages outside every
 * tree (the docs home) get a lone "Docs" crumb and point at the first page.
 */
export function getPageContext(url: string): PageContext {
  const tabId = getActiveDocsTab(url);
  const tab = DOCS_TABS.find((t) => t.id === tabId);
  const tree = splitDocsTree(source.pageTree)[tabId];
  const path = findPath(
    tree.children,
    (node) => node.type === "page" && node.url === url,
  );

  if (!path || !tab) {
    return {
      crumbs: [{ label: "Docs" }],
      next: toNeighbour(flattenTree(tree.children)[0]),
    };
  }

  // `Typography › Inline Word Roll`: the nearest folder (or the library when
  // the page sits at its root), then the page. A category's own landing page
  // reads `Components › Typography` instead of repeating its name.
  const page = path.at(-1);
  const parent = path.findLast((node) => node.type === "folder");
  const crumbs: Crumb[] =
    parent && folderHref(parent) !== url
      ? [{ label: label(parent), href: folderHref(parent) }]
      : [{ label: tab.label, href: tab.href }];
  if (page) crumbs.push({ label: label(page) });

  const { previous, next } = findNeighbour(tree, url);
  return {
    crumbs,
    previous: toNeighbour(previous),
    next: toNeighbour(next),
  };
}
