import type { Node, Root } from "fumadocs-core/page-tree";

/**
 * The docs are split into top-level category tabs surfaced in `DocsHeader`.
 * Each tab owns its own sidebar tree (see {@link splitDocsTree}); the split is
 * purely a view over the existing Fumadocs page tree.
 */
export type DocsTabId =
  | "components"
  | "primitives"
  | "shaders"
  | "filters"
  | "templates"
  | "icons";

export type DocsTab = {
  id: DocsTabId;
  label: string;
  /** Landing page when the tab is clicked from the other tab. */
  href: string;
};

export const DOCS_TABS: DocsTab[] = [
  {
    id: "components",
    label: "Components",
    href: "/docs/getting-started/introduction",
  },
  { id: "primitives", label: "Primitives", href: "/docs/ui" },
  {
    id: "shaders",
    label: "Shaders",
    href: "/docs/shaders/getting-started/introduction",
  },
  {
    id: "filters",
    label: "Filters",
    href: "/docs/filters/getting-started/introduction",
  },
  {
    id: "templates",
    label: "Templates",
    href: "/docs/templates/introducing-product",
  },
  {
    id: "icons",
    label: "Icons",
    href: "/docs/icons/gallery",
  },
];

/** URL prefix that backs the Primitives tab (the remocn-ui section). */
const PRIMITIVES_PREFIX = "/docs/ui";

/** A pathname belongs to Primitives when it is the ui index or any ui page. */
function isPrimitivesPath(pathname: string): boolean {
  return (
    pathname === PRIMITIVES_PREFIX ||
    pathname.startsWith(`${PRIMITIVES_PREFIX}/`)
  );
}

const SHADERS_PREFIX = "/docs/shaders";

function isShadersPath(pathname: string): boolean {
  return (
    pathname === SHADERS_PREFIX || pathname.startsWith(`${SHADERS_PREFIX}/`)
  );
}

const FILTERS_PREFIX = "/docs/filters";

function isFiltersPath(pathname: string): boolean {
  return (
    pathname === FILTERS_PREFIX || pathname.startsWith(`${FILTERS_PREFIX}/`)
  );
}

const TEMPLATES_PREFIX = "/docs/templates";

function isTemplatesPath(pathname: string): boolean {
  return (
    pathname === TEMPLATES_PREFIX || pathname.startsWith(`${TEMPLATES_PREFIX}/`)
  );
}

const ICONS_PREFIX = "/docs/icons";

function isIconsPath(pathname: string): boolean {
  return pathname === ICONS_PREFIX || pathname.startsWith(`${ICONS_PREFIX}/`);
}

export function getActiveDocsTab(pathname: string): DocsTabId {
  if (isShadersPath(pathname)) return "shaders";
  if (isFiltersPath(pathname)) return "filters";
  if (isTemplatesPath(pathname)) return "templates";
  if (isIconsPath(pathname)) return "icons";
  if (isPrimitivesPath(pathname)) return "primitives";
  return "components";
}

/** True for the root-level folder node that holds the remocn-ui (ui) section. */
function isPrimitivesNode(node: Node): boolean {
  if (node.type !== "folder") return false;
  if (node.index?.url === PRIMITIVES_PREFIX) return true;
  return node.children.some(
    (child) =>
      child.type === "page" && child.url.startsWith(`${PRIMITIVES_PREFIX}/`),
  );
}

/**
 * True for the root-level folder node that owns `prefix`, matching a section
 * however deeply its pages nest (shaders, filters and icons all group their
 * pages under sub-folders). Kept separate from {@link isPrimitivesNode}, which
 * only ever looks one level down.
 */
function sectionNodeMatcher(prefix: string): (node: Node) => boolean {
  const hasDescendant = (node: Node): boolean => {
    if (node.type === "page") return node.url.startsWith(`${prefix}/`);
    if (node.type === "folder") {
      if (node.index?.url === prefix) return true;
      return node.children.some(hasDescendant);
    }
    return false;
  };

  return (node) => {
    if (node.type !== "folder") return false;
    if (node.index?.url === prefix) return true;
    return node.children.some(hasDescendant);
  };
}

const isShadersNode = sectionNodeMatcher(SHADERS_PREFIX);
const isFiltersNode = sectionNodeMatcher(FILTERS_PREFIX);
const isTemplatesNode = sectionNodeMatcher(TEMPLATES_PREFIX);
const isIconsNode = sectionNodeMatcher(ICONS_PREFIX);

/**
 * Hoists a matched folder's own index page and children up to the tab root, so
 * the Primitives sidebar reads its pages directly (Introduction / Concepts /
 * Installation / Components) instead of nesting them under a single "UI" group.
 * Non-folder nodes pass through untouched.
 */
function hoistPrimitives(nodes: Node[]): Node[] {
  return nodes.flatMap((node) =>
    node.type === "folder"
      ? [node.index, ...node.children].filter((n): n is Node => Boolean(n))
      : [node],
  );
}

/**
 * Splits the Fumadocs page tree into category tab trees. Immutable — the source
 * `Root` (shared across requests) is never mutated; each branch is a shallow
 * copy with a filtered `children` list, so order is preserved within each tab.
 * Compose after {@link withNewBadges} so the badge decoration survives the split.
 *
 * Each branch gets a DISTINCT, stable `$id`. This is load-bearing: fumadocs'
 * `TreeContextProvider` memoizes the active tree with
 * `useMemo(() => rawTree, [rawTree.$id ?? rawTree])`. The source root's `$id` is
 * the literal "root", so two plain shallow copies would share it — the memo dep
 * would never change when `DocsShell` swaps trees on a tab switch, freezing the
 * sidebar on the first tab until a full page reload. Distinct ids make the dep
 * differ per tab so the sidebar updates client-side.
 *
 * The Primitives branch is additionally hoisted (see {@link hoistPrimitives}) so
 * the remocn-ui pages render at the sidebar root without a wrapping "UI" label.
 */
export function splitDocsTree(tree: Root): {
  components: Root;
  primitives: Root;
  shaders: Root;
  filters: Root;
  templates: Root;
  icons: Root;
} {
  return {
    components: {
      ...tree,
      $id: "docs-tab-components",
      children: tree.children.filter(
        (node) =>
          !isPrimitivesNode(node) &&
          !isShadersNode(node) &&
          !isFiltersNode(node) &&
          !isTemplatesNode(node) &&
          !isIconsNode(node),
      ),
    },
    primitives: {
      ...tree,
      $id: "docs-tab-primitives",
      children: hoistPrimitives(tree.children.filter(isPrimitivesNode)),
    },
    shaders: {
      ...tree,
      $id: "docs-tab-shaders",
      children: hoistPrimitives(tree.children.filter(isShadersNode)),
    },
    filters: {
      ...tree,
      $id: "docs-tab-filters",
      children: hoistPrimitives(tree.children.filter(isFiltersNode)),
    },
    templates: {
      ...tree,
      $id: "docs-tab-templates",
      children: hoistPrimitives(tree.children.filter(isTemplatesNode)),
    },
    icons: {
      ...tree,
      $id: "docs-tab-icons",
      children: hoistPrimitives(tree.children.filter(isIconsNode)),
    },
  };
}
