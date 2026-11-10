import type { Folder, Item, Node } from "fumadocs-core/page-tree";
import type { ReactNode } from "react";
import { NEW_BADGE_PATHS } from "@/config/site";
import { DOCS_TABS, type DocsTabId } from "@/lib/docs-tabs";
import iconsRegistry from "@/registry/remocn-icons/registry.json";
import type { source as docsSourceType } from "@/source";

/**
 * Read-only queries over the fumadocs page tree that the docs index screens
 * (docs home, category indexes, library overviews) render from. Everything a
 * card shows (titles, descriptions, counts, "new" tags, order) is derived here
 * so the index MDX never restates data that already lives in the content.
 */

export type DocEntry = {
  url: string;
  title: string;
  description?: string;
  /** Registry name from the page's `component` frontmatter. */
  component?: string;
  isNew: boolean;
};

type DocsSource = typeof docsSourceType;
export type DocPage = ReturnType<DocsSource["getPages"]>[number];

// `@/source` must never be imported statically from here: the index MDX pages
// render these helpers, and `@/source` imports the MDX pages, so a static
// import evaluates `source` while `.source/server` is still initialising
// (500 on every route that loads the docs collection first, e.g. the RSS
// feed). Components load it once per render with `await loadDocsSource()`.
let loaded: DocsSource | undefined;
let pageMap: Map<string, DocPage> | undefined;

/** Await before calling any helper below (server components only). */
export async function loadDocsSource(): Promise<DocsSource> {
  loaded ??= (await import("@/source")).source;
  return loaded;
}

/** The fumadocs source, once `loadDocsSource()` has resolved. */
export function docsSource(): DocsSource {
  if (!loaded) {
    throw new Error("Call `await loadDocsSource()` before reading docs data.");
  }
  return loaded;
}

function pagesByUrl() {
  pageMap ??= new Map(
    docsSource()
      .getPages()
      .map((page) => [page.url, page]),
  );
  return pageMap;
}

/** Raw fumadocs page (all frontmatter) by docs url. */
export function getPage(url: string): DocPage | undefined {
  return pagesByUrl().get(url);
}

export function getEntry(url: string): DocEntry | undefined {
  const page = pagesByUrl().get(url);
  if (!page) return undefined;
  return {
    url: page.url,
    title: page.data.navTitle ?? page.data.title,
    description: page.data.description,
    component: page.data.component,
    isNew: NEW_BADGE_PATHS.has(page.url),
  };
}

/** Every page item under a node, in sidebar order (folder index first). */
function itemsOf(node: Node): Item[] {
  if (node.type === "page") return [node];
  if (node.type === "folder") {
    return [
      ...(node.index ? [node.index] : []),
      ...node.children.flatMap(itemsOf),
    ];
  }
  return [];
}

function folderUrl(folder: Folder): string | undefined {
  return folder.index?.url ?? itemsOf(folder)[0]?.url;
}

/** Top-level folder whose pages live under `prefix` (e.g. "/docs/typography"). */
export function getSection(prefix: string): Folder | undefined {
  return docsSource().pageTree.children.find(
    (node): node is Folder =>
      node.type === "folder" &&
      itemsOf(node).some(
        (item) => item.url === prefix || item.url.startsWith(`${prefix}/`),
      ),
  );
}

/** Pages of a section that document a registry component, in sidebar order. */
export function getComponentEntries(prefix: string): DocEntry[] {
  const folder = getSection(prefix);
  if (!folder) return [];
  return itemsOf(folder)
    .map((item) => getEntry(item.url))
    .filter((entry): entry is DocEntry => Boolean(entry?.component));
}

/** All pages of a section in sidebar order, components or not. */
export function getSectionEntries(prefix: string): DocEntry[] {
  const folder = getSection(prefix);
  if (!folder) return [];
  return itemsOf(folder)
    .map((item) => getEntry(item.url))
    .filter((entry): entry is DocEntry => Boolean(entry));
}

/** "New" when the whole section is new, "3 new" when part of it is. */
export function newLabel(entries: DocEntry[]): string | undefined {
  const fresh = entries.filter((entry) => entry.isNew).length;
  if (!fresh) return undefined;
  return fresh === entries.length ? "New" : `${fresh} new`;
}

/** Library tabs: everything in the sidebar switcher except Components and Templates. */
const LIBRARY_TABS: DocsTabId[] = [
  "primitives",
  "shaders",
  "filters",
  "captions",
  "icons",
];

const TAB_PREFIX: Record<DocsTabId, string> = {
  components: "/docs",
  primitives: "/docs/ui",
  shaders: "/docs/shaders",
  filters: "/docs/filters",
  captions: "/docs/captions",
  templates: "/docs/templates",
  icons: "/docs/icons",
};

const ICON_COUNT = iconsRegistry.items.filter((item) =>
  item.name.startsWith("icon-"),
).length;

export type Category = {
  url: string;
  title: string;
  description?: string;
  icon: ReactNode;
  count: number;
  newLabel?: string;
};

/**
 * Component categories of the docs home: every top-level section that holds
 * component pages and is not a library tab, in sidebar (root meta.json) order.
 */
export function getCategories(): Category[] {
  const libraryPrefixes = LIBRARY_TABS.map((id) => TAB_PREFIX[id]);
  return docsSource().pageTree.children.flatMap((node) => {
    if (node.type !== "folder") return [];
    const url = folderUrl(node);
    if (
      !url ||
      libraryPrefixes.some(
        (prefix) => url === prefix || url.startsWith(`${prefix}/`),
      )
    ) {
      return [];
    }
    const entries = itemsOf(node)
      .map((item) => getEntry(item.url))
      .filter((entry): entry is DocEntry => Boolean(entry?.component));
    if (!entries.length) return [];
    // Sections list "index" in meta.json, so the index page is the first item
    // rather than `folder.index`.
    const first = getEntry(url);
    const index = first?.component ? undefined : first;
    return [
      {
        url,
        title: typeof node.name === "string" ? node.name : (index?.title ?? ""),
        description: index?.description,
        icon: node.icon,
        count: entries.length,
        newLabel: newLabel(entries),
      },
    ];
  });
}

export type Library = {
  id: DocsTabId;
  label: string;
  href: string;
  count: number;
};

/** Library tabs with their component counts (icons count the icon registry). */
export function getLibraries(): Library[] {
  return DOCS_TABS.filter((tab) => LIBRARY_TABS.includes(tab.id)).map(
    (tab) => ({
      id: tab.id,
      label: tab.label,
      href: tab.href,
      count:
        tab.id === "icons"
          ? ICON_COUNT
          : getComponentEntries(TAB_PREFIX[tab.id]).length,
    }),
  );
}

export type EntryGroup = { title: string; entries: DocEntry[] };

/**
 * A section split at its meta.json `---Label---` separators, e.g. the guides
 * section's "Videos" and "Practices". Pages before the first separator are
 * returned under an empty title.
 */
export function getSeparatedGroups(prefix: string): EntryGroup[] {
  const folder = getSection(prefix);
  if (!folder) return [];
  const groups: EntryGroup[] = [{ title: "", entries: [] }];
  for (const node of folder.children) {
    if (node.type === "separator") {
      groups.push({
        title: typeof node.name === "string" ? node.name : "",
        entries: [],
      });
      continue;
    }
    for (const item of itemsOf(node)) {
      const entry = getEntry(item.url);
      if (entry) groups[groups.length - 1].entries.push(entry);
    }
  }
  return groups;
}

export type GuideMedia = {
  /** Approximate runtime in seconds, read from the "~30-second" description. */
  seconds?: number;
  poster?: string;
  video?: string;
};

/** The finished video a guide page opens with (its `<GuideVideo>`), if any. */
export async function getGuideMedia(url: string): Promise<GuideMedia> {
  const page = pagesByUrl().get(url);
  if (!page) return {};
  const data = page.data as typeof page.data & {
    getText: (type: "raw" | "processed") => Promise<string>;
  };
  const raw = await data.getText("raw");
  const seconds = /~(\d+)-second/.exec(page.data.description ?? "")?.[1];
  return {
    seconds: seconds ? Number(seconds) : undefined,
    poster: /<GuideVideo[^>]*\bposter="([^"]+)"/.exec(raw)?.[1],
    video: /<GuideVideo[^>]*\bsrc="([^"]+)"/.exec(raw)?.[1],
  };
}
