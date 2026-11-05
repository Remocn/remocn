import type { ReactNode } from "react";

export type ComponentGroupProps = {
  /**
   * Pages in this group: slugs inside the category (`"soft-blur-in"`) or full
   * docs urls for a page that lives elsewhere.
   */
  items: string[];
  /** The group's `##` heading and an optional lead paragraph, in MDX. */
  children: ReactNode;
};

/**
 * Declares one group of a `<CategoryIndex>`. It renders nothing by itself:
 * `CategoryIndex` reads its props and lays the groups out.
 */
export function ComponentGroup(_props: ComponentGroupProps) {
  return null;
}
