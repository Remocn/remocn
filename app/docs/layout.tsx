import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsShell } from "@/components/docs/docs-shell";
import { DocsTabsBar } from "@/components/docs/docs-tabs-bar";
import { splitDocsTree } from "@/lib/docs-tabs";
import { withNewBadges } from "@/lib/with-new-badges";
import remocnRegistry from "@/registry/remocn/registry.json";
import iconsRegistry from "@/registry/remocn-icons/registry.json";
import uiRegistry from "@/registry/remocn-ui/registry.json";
import { source } from "@/source";

const componentCount = [remocnRegistry, uiRegistry, iconsRegistry]
  .flatMap((registry) => registry.items)
  .filter((item) => item.type === "registry:component").length;

export default async function Layout({ children }: { children: ReactNode }) {
  // Decorate the shared page tree with the animated "NEW" sidebar badge (see
  // `withNewBadges`), then split it into the Components / Primitives tab trees
  // (see `splitDocsTree`). Both run on the server; `DocsShell` picks the tree
  // matching the active tab by pathname so each tab owns its own sidebar.
  const { components, primitives, shaders, filters, icons } = splitDocsTree(
    withNewBadges(source.pageTree),
  );

  return (
    // fumadocs search + sidebar context lives here (docs-only) instead of the
    // root layout, so non-docs routes never compile fumadocs-ui. `theme.enabled:
    // false` defers to the root next-themes ThemeProvider — no double provider.
    <RootProvider theme={{ enabled: false }}>
      {/* Custom remocn chrome: the main header (logo + site nav + actions), then
          a thin bar holding the Components/Primitives switcher. Both are static
          (non-sticky) and content-aligned so they track the docs grid — logo
          over the sidebar, tabs starting at the article column's left edge. */}
      <DocsHeader />
      <DocsTabsBar />
      <DocsShell
        componentsTree={components}
        primitivesTree={primitives}
        shadersTree={shaders}
        filtersTree={filters}
        iconsTree={icons}
        componentCount={componentCount}
      >
        {children}
      </DocsShell>
    </RootProvider>
  );
}
