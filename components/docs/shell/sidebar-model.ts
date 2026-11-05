import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";
import { NEW_BADGE_PATHS } from "@/config/site";
import type { DocsTabId } from "@/lib/docs-tabs";

/**
 * Plain, serialisable view of one library's sidebar. Built on the server from
 * the fumadocs page tree (after `splitDocsTree`), so the client sidebar only
 * gets strings and numbers: names for filtering, urls for the active state,
 * counts and "new" flags for the row badges.
 */
export type SidebarEntry =
  | { kind: "page"; name: string; url: string; isNew: boolean }
  | { kind: "label"; name: string };

export type SidebarGroup = {
  /** Folder slug (`typography`, `getting-started`), keys the row icon. */
  id: string;
  name: string;
  /** Category landing page (`/docs/typography`), when the folder has one. */
  indexUrl?: string;
  entries: SidebarEntry[];
  /** Pages in the group, the folder index excluded. */
  count: number;
  /** How many of those pages are listed in `NEW_BADGE_PATHS`. */
  newCount: number;
  /** "Getting started" stays open; it and "Overview" carry no count. */
  pinned: boolean;
  showCount: boolean;
};

export type SidebarModel = { tab: DocsTabId; groups: SidebarGroup[] };

const PINNED = "getting-started";

function pageName(item: Item): string {
  return typeof item.name === "string" ? item.name : item.url;
}

function pagesOf(folder: Folder): Item[] {
  const out: Item[] = [];
  const walk = (node: Node) => {
    if (node.type === "page") out.push(node);
    else if (node.type === "folder") {
      if (node.index) out.push(node.index);
      node.children.forEach(walk);
    }
  };
  walk(folder);
  return out;
}

/**
 * The folder's url base: the segments every page shares
 * (`/docs/typography` + `/docs/typography/a` → `/docs/typography`), or the
 * lone page's directory.
 */
function folderBase(folder: Folder): string {
  const urls = pagesOf(folder).map((p) => p.url.split("/"));
  if (urls.length === 0) return "";
  if (urls.length === 1) return urls[0].slice(0, -1).join("/");
  const common: string[] = [];
  for (const [i, segment] of urls[0].entries()) {
    if (urls.some((u) => u[i] !== segment)) break;
    common.push(segment);
  }
  return common.join("/");
}

function toEntries(nodes: Node[], skipUrl?: string): SidebarEntry[] {
  return nodes.flatMap((node): SidebarEntry[] => {
    if (node.type === "separator") {
      return typeof node.name === "string"
        ? [{ kind: "label", name: node.name }]
        : [];
    }
    if (node.type === "folder") {
      // Nested folders flatten into a labelled run, like the guides' separators.
      const inner = toEntries(
        node.index ? [node.index, ...node.children] : node.children,
      );
      return typeof node.name === "string"
        ? [{ kind: "label", name: node.name }, ...inner]
        : inner;
    }
    if (node.url === skipUrl) return [];
    return [
      {
        kind: "page",
        name: pageName(node),
        url: node.url,
        isNew: NEW_BADGE_PATHS.has(node.url),
      },
    ];
  });
}

function toGroup(folder: Folder): SidebarGroup {
  const base = folderBase(folder);
  const id = base.split("/").at(-1) ?? "";
  const indexUrl =
    folder.index?.url ??
    folder.children.find((n): n is Item => n.type === "page" && n.url === base)
      ?.url;
  const entries = toEntries(folder.children, indexUrl);
  const pages = entries.filter((e) => e.kind === "page");
  return {
    id,
    name: typeof folder.name === "string" ? folder.name : id,
    indexUrl,
    entries,
    count: pages.length,
    newCount: pages.filter((e) => e.kind === "page" && e.isNew).length,
    pinned: id === PINNED,
    showCount: id !== PINNED,
  };
}

/**
 * Turns one tab's tree into sidebar groups. Loose root pages (Primitives'
 * Introduction / Concepts / Installation, the template pages, the icon
 * gallery) collect into one leading group: "Overview" when the tab also has
 * folders, the library name when the loose pages are the whole tab.
 */
export function buildSidebarModel(
  tab: DocsTabId,
  label: string,
  tree: Root,
  counts: Partial<Record<string, number>> = {},
): SidebarModel {
  const loose = tree.children.filter((n): n is Item => n.type === "page");
  const folders = tree.children.filter((n): n is Folder => n.type === "folder");
  const groups = folders.map(toGroup);

  if (loose.length > 0) {
    const entries = toEntries(loose);
    groups.unshift({
      id: tab,
      name: folders.length > 0 ? "Overview" : label,
      entries,
      count: entries.length,
      newCount: entries.filter((e) => e.kind === "page" && e.isNew).length,
      pinned: false,
      showCount: folders.length === 0,
    });
  }

  return {
    tab,
    groups: groups.map((group) => ({
      ...group,
      count: counts[group.id] ?? group.count,
    })),
  };
}
