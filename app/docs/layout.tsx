import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { PageShell } from "@/app/(home)/components/page-shell";
import { SiteFooter } from "@/app/(home)/components/site-footer";
import { SiteHeader } from "@/app/(home)/components/site-header";
import { DocsShell } from "@/components/docs/docs-shell";
import { HeaderSearch } from "@/components/docs/shell/header-search";
import {
  buildSidebarModel,
  type SidebarModel,
} from "@/components/docs/shell/sidebar-model";
import { DOCS_LAYOUT, docsLayoutVars } from "@/lib/docs-layout";
import { DOCS_TABS, type DocsTabId, splitDocsTree } from "@/lib/docs-tabs";
import iconsRegistry from "@/registry/remocn-icons/registry.json";
import { source } from "@/source";

const iconCount = iconsRegistry.items.filter(
  (item) => item.type === "registry:component",
).length;

export default function Layout({ children }: { children: ReactNode }) {
  // Split the page tree into one tree per library and flatten each into a
  // plain sidebar model on the server; the shell picks one by pathname.
  const trees = splitDocsTree(source.pageTree);
  const models = Object.fromEntries(
    DOCS_TABS.map((tab) => [
      tab.id,
      buildSidebarModel(tab.id, tab.label, trees[tab.id], {
        icons: iconCount,
      }),
    ]),
  ) as Record<DocsTabId, SidebarModel>;

  return (
    // fumadocs search context lives here (docs-only) instead of the root
    // layout, so non-docs routes never compile fumadocs-ui. `theme.enabled:
    // false` defers to the root next-themes ThemeProvider.
    <RootProvider theme={{ enabled: false }}>
      <PageShell>
        {/* Frame sizes as CSS variables (`lib/docs-layout.ts`); `contents`
            keeps the flex column of the page shell intact. The docs layout
            lab finds this element and rewrites the variables live. */}
        <div
          data-docs-layout
          className="contents"
          style={docsLayoutVars(DOCS_LAYOUT)}
        >
          {/* The header sits 20px from the top like the docs artboards (28px
            on the landing). */}
          <div className="lg:[&>header>div]:pt-5">
            <SiteHeader mobileAction={<HeaderSearch />} />
          </div>
          <DocsShell models={models}>{children}</DocsShell>
          {/* The footer gets the docs' hairline on top. */}
          <div className="border-hairline lg:border-t lg:pt-7 lg:[&>footer]:pb-8">
            <SiteFooter />
          </div>
        </div>
      </PageShell>
    </RootProvider>
  );
}
