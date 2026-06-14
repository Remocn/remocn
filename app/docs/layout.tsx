import type { ReactNode } from "react";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsShell } from "@/components/docs/docs-shell";
import { DocsSponsorBanner } from "@/components/docs/docs-sponsor-banner";
import { DocsTabsBar } from "@/components/docs/docs-tabs-bar";
import { splitDocsTree } from "@/lib/docs-tabs";
import { withNewBadges } from "@/lib/with-new-badges";
import { source } from "@/source";

export default async function Layout({ children }: { children: ReactNode }) {
  // Decorate the shared page tree with the animated "NEW" sidebar badge (see
  // `withNewBadges`), then split it into the Components / Primitives tab trees
  // (see `splitDocsTree`). Both run on the server; `DocsShell` picks the tree
  // matching the active tab by pathname so each tab owns its own sidebar.
  const { components, primitives } = splitDocsTree(
    withNewBadges(source.pageTree),
  );

  return (
    <>
      {/* Custom remocn chrome: the main header (logo + site nav + actions), then
          a thin bar holding the Components/Primitives switcher. Both are static
          (non-sticky) and content-aligned so they track the docs grid — logo
          over the sidebar, tabs starting at the article column's left edge. */}
      <DocsHeader />
      <DocsTabsBar />
      {/* `relative` anchor begins just below the sticky tab bar so the floating
          sponsor banner's `top-0` lands at the docs content top. The banner is
          absolute (non-sticky) and overlaps the article/TOC top-right. */}
      <div className="relative">
        <DocsSponsorBanner />
        <DocsShell componentsTree={components} primitivesTree={primitives}>
          {children}
        </DocsShell>
      </div>
    </>
  );
}
