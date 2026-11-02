import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  type DocEntry,
  getComponentEntries,
  getEntry,
  loadDocsSource,
} from "../data";
import { type BrowserGroup, CategoryBrowser } from "./category-browser";
import { ComponentGroup, type ComponentGroupProps } from "./component-group";

/** Plain text of an MDX node (the heading's label). */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

/** The `id` fumadocs put on the group's MDX heading. */
function idOf(node: ReactNode): string | undefined {
  for (const child of Children.toArray(node)) {
    if (isValidElement<{ id?: string }>(child) && child.props.id) {
      return child.props.id;
    }
  }
  return undefined;
}

/**
 * A component category index: a filter bar (search, order, group chips) over
 * the category's components, grouped by the `<ComponentGroup>` children.
 * Titles, descriptions, "new" tags and the sidebar order come from the pages;
 * any component page not listed in a group lands in a trailing "More" group so
 * the index can never silently miss one. Without groups it is one flat grid.
 *
 * ```mdx
 * <CategoryIndex section="/docs/typography">
 *
 * <ComponentGroup items={["soft-blur-in", "tracking-in"]}>
 *
 * ## Reveals
 *
 * </ComponentGroup>
 *
 * </CategoryIndex>
 * ```
 */
export async function CategoryIndex({
  section,
  noun = "components",
  children,
}: {
  /** Docs url of the category, e.g. "/docs/typography". */
  section: string;
  /** What the filter placeholder calls the items. */
  noun?: string;
  children?: ReactNode;
}) {
  await loadDocsSource();
  const sectionEntries = getComponentEntries(section);
  const order = new Map(
    sectionEntries.map((entry, index) => [entry.url, index]),
  );
  const listed = new Set<string>();

  const groups: (Omit<BrowserGroup, "entries"> & { entries: DocEntry[] })[] =
    Children.toArray(children)
      .filter(
        (child): child is ReactElement<ComponentGroupProps> =>
          isValidElement(child) && child.type === ComponentGroup,
      )
      .map((child, index) => {
        const entries = child.props.items
          .map((item) =>
            getEntry(item.startsWith("/") ? item : `${section}/${item}`),
          )
          .filter((entry): entry is DocEntry => Boolean(entry));
        for (const entry of entries) listed.add(entry.url);
        return {
          id: idOf(child.props.children) ?? `group-${index}`,
          title: textOf(
            Children.toArray(child.props.children).find(
              (node) => isValidElement<{ id?: string }>(node) && node.props.id,
            ),
          ),
          heading: <>{child.props.children}</>,
          entries,
        };
      });

  const rest = sectionEntries.filter((entry) => !listed.has(entry.url));
  if (rest.length) {
    groups.push({
      id: groups.length ? "more" : "all",
      title: groups.length ? "More" : "",
      heading: groups.length ? (
        <h2 key="more" id="more">
          More
        </h2>
      ) : null,
      entries: rest,
    });
  }

  return (
    <CategoryBrowser
      groups={groups.map((group) => ({
        ...group,
        entries: group.entries.map((entry) => ({
          ...entry,
          order: order.get(entry.url) ?? Number.MAX_SAFE_INTEGER,
        })),
      }))}
      noun={noun}
    />
  );
}
