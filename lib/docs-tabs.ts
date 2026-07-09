import type { Node, Root } from "fumadocs-core/page-tree";

/**
 * The docs are split into two top-level tabs surfaced in `DocsHeader`. Each tab
 * owns its own sidebar tree (see {@link splitDocsTree}): "Primitives" holds only
 * the remocn-ui section (`/docs/ui/*`); "Components" holds everything else,
 * unchanged from the flat docs structure. No files move and no URLs change —
 * the split is purely a view over the existing Fumadocs page tree.
 */
export type DocsTabId = "components" | "primitives" | "shaders" | "icons";

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

const ICONS_PREFIX = "/docs/icons";

function isIconsPath(pathname: string): boolean {
  return pathname === ICONS_PREFIX || pathname.startsWith(`${ICONS_PREFIX}/`);
}

export function getActiveDocsTab(pathname: string): DocsTabId {
  if (isShadersPath(pathname)) return "shaders";
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

/** True if the node (or any descendant) is a shaders page — folders now nest. */
function hasShadersDescendant(node: Node): boolean {
  if (node.type === "page") return node.url.startsWith(`${SHADERS_PREFIX}/`);
  if (node.type === "folder") {
    if (node.index?.url === SHADERS_PREFIX) return true;
    return node.children.some(hasShadersDescendant);
  }
  return false;
}

function isShadersNode(node: Node): boolean {
  if (node.type !== "folder") return false;
  if (node.index?.url === SHADERS_PREFIX) return true;
  return node.children.some(hasShadersDescendant);
}

function hasIconsDescendant(node: Node): boolean {
  if (node.type === "page") return node.url.startsWith(`${ICONS_PREFIX}/`);
  if (node.type === "folder") {
    if (node.index?.url === ICONS_PREFIX) return true;
    return node.children.some(hasIconsDescendant);
  }
  return false;
}

function isIconsNode(node: Node): boolean {
  if (node.type !== "folder") return false;
  if (node.index?.url === ICONS_PREFIX) return true;
  return node.children.some(hasIconsDescendant);
}

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
 * Splits the Fumadocs page tree into the two tab trees. Immutable — the source
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
    icons: {
      ...tree,
      $id: "docs-tab-icons",
      children: hoistPrimitives(tree.children.filter(isIconsNode)),
    },
  };
}
