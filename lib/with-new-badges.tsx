import type { Item, Node, Root } from "fumadocs-core/page-tree";
import { NewBadge } from "@/components/docs/new-badge";
import { NEW_BADGE_PATHS } from "@/config/site";

/**
 * Returns a copy of the Fumadocs page tree with an animated {@link NewBadge}
 * appended to the label of every sidebar item whose `url` is listed in
 * {@link NEW_BADGE_PATHS}. The Fumadocs sidebar renders an item's `name`
 * (a `ReactNode`) verbatim, so wrapping it as `<>{name} <NewBadge/></>` is all
 * that's needed to surface the badge in the rail.
 *
 * The walk is immutable — `source.pageTree` is built once and shared across
 * requests, so mutating it in place would let badges accumulate on the same
 * node across renders. Every touched node is shallow-cloned instead.
 */
export function withNewBadges(tree: Root): Root {
  return { ...tree, children: tree.children.map(decorate) };
}

function decorate(node: Node): Node {
  if (node.type === "page") return decorateItem(node);
  if (node.type === "folder") {
    return {
      ...node,
      // `folder.index` is the folder's own landing page — decorate it too so a
      // badged folder index doesn't lose its tag, then recurse the children.
      index: node.index ? decorateItem(node.index) : node.index,
      children: node.children.map(decorate),
    };
  }
  return node;
}

/** Append the badge to a page item's label when its url is opted in. */
function decorateItem(item: Item): Item {
  return NEW_BADGE_PATHS.has(item.url)
    ? {
        ...item,
        name: (
          <>
            {item.name}
            <NewBadge />
          </>
        ),
      }
    : item;
}
