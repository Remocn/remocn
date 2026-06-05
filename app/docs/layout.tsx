import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { DOCS_NAV } from "@/config/landing";
import { SiteHeader } from "@/app/(home)/components/site-header";
import { getGitHubStars } from "@/lib/github";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/source";

export default async function Layout({ children }: { children: ReactNode }) {
  const githubStars = await getGitHubStars();

  return (
    <>
      {/* Custom remocn chrome owns the only top nav. Static (non-sticky) in
          docs and `fluid` (full-width) so the logo aligns to the left edge of
          the sidebar instead of floating inward at the contained width. */}
      <SiteHeader
        sticky={false}
        fluid
        navLinks={DOCS_NAV}
        githubStars={githubStars}
      />
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions()}
        // Suppress the Fumadocs default top nav so there is no double header —
        // `SiteHeader` above is the single top bar. Verified against
        // fumadocs-ui 16.7 `NavOptions.enabled` (layouts/shared) and the
        // `navEnabled && jsx(slots.header)` guard in layouts/docs/client.
        nav={{ enabled: false }}
        // Render the search field in the sidebar header. fumadocs-ui 16.7
        // builds `slots.searchTrigger` only when `searchToggle.enabled` is
        // truthy (layouts/shared/client.js), and the sidebar slot renders
        // `slots.searchTrigger.full` — the large search bar — at the top of
        // the rail (layouts/docs/slots/sidebar.js). Search itself is already
        // wired: `RootProvider` enables it by default and `app/api/search`
        // serves the index.
        searchToggle={{ enabled: true }}
        // Remove the sidebar footer. fumadocs-ui 16.7 renders the footer block
        // only when `languageSelect || iconLinks.length || themeSwitch || footer`
        // is truthy (layouts/docs/slots/sidebar.js). This app has no i18n
        // (single locale → no languageSelect), no nav `links`/`githubUrl` (→ no
        // iconLinks), and passes no `footer`, so the theme switch is the only
        // thing populating it — disabling it drops the whole footer.
        themeSwitch={{ enabled: false }}
        // Remove the sidebar hide/collapse button: fumadocs-ui 16.7 renders the
        // collapse trigger only under `collapsible && <SidebarCollapseTrigger>`
        // (slots/sidebar.js), so `collapsible: false` drops it (and the floating
        // re-expand trigger, since the rail can no longer collapse).
        sidebar={{ collapsible: false }}
      >
        {/* `relative isolate` scopes the decorative grid to the content column so
            it sits behind the page body but above the base background — the same
            dotted-grid backdrop used behind the landing hero, for visual
            continuity when crossing from the landing into the docs. */}
        <div className="relative isolate">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-grid-fade"
          />
          {children}
        </div>
      </DocsLayout>
    </>
  );
}
