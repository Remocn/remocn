import type { ReactNode } from "react";
import { loadDocsSource } from "../data";
import { IndexSection } from "../index-section";
import { getLibraryItems } from "./library-data";
import { LibraryGrid } from "./library-grid";
import type { LibraryKind } from "./tile-preview";

const PREFIX: Record<LibraryKind, string> = {
  shader: "/docs/shaders",
  filter: "/docs/filters",
  caption: "/docs/captions",
};

/**
 * "All shaders" (filters, caption styles): every component page of the
 * library with its vibe, from the page tree. The MDX heading and lead line
 * arrive as children.
 *
 * ```mdx
 * <LibraryGallery kind="shader">
 *
 * ## All shaders
 *
 * Defaults are deliberately muted.
 *
 * </LibraryGallery>
 * ```
 */
export async function LibraryGallery({
  kind,
  children,
}: {
  kind: LibraryKind;
  children: ReactNode;
}) {
  await loadDocsSource();
  const items = getLibraryItems(PREFIX[kind]);

  return (
    <IndexSection
      heading={children}
      count={items.length}
      className="[&_p]:max-w-[680px]"
    >
      <LibraryGrid items={items} kind={kind} />
    </IndexSection>
  );
}
