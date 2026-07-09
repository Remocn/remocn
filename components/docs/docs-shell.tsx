"use client";

import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getActiveDocsTab } from "@/lib/docs-tabs";
import { baseOptions } from "@/lib/layout.shared";

/**
 * Renders the Fumadocs `DocsLayout` with the sidebar tree that matches the
 * active docs tab. Both trees are built once on the server (in `app/docs/layout`)
 * and handed down; this client shell only picks between them by pathname, so the
 * Components and Primitives tabs each get their own sidebar without moving any
 * files or changing URLs. The page body arrives as server-rendered `children`,
 * so the RSC boundary stays intact — only the layout chrome is client-rendered.
 *
 * The `DocsLayout` props mirror the previous server layout: the custom
 * `DocsHeader` above owns the only top nav (`nav` disabled), search renders in
 * the sidebar header, and the theme switch / collapse trigger / sidebar footer
 * are suppressed. The decorative grid scopes a dotted backdrop to the content
 * column for visual continuity with the landing hero.
 *
 * `containerProps` sets `--fd-banner-height` to the sticky `DocsTabsBar` height
 * (h-11 = 2.75rem). fumadocs derives `--fd-docs-row-1: var(--fd-banner-height, 0px)`
 * and sticks the sidebar/TOC at `top-(--fd-docs-row-1)`, dropping them just below
 * the pinned tab bar instead of letting the bar overlap the sidebar top.
 *
 * On the icons tab the sidebar is disabled, but fumadocs still reserves the
 * `--fd-sidebar-width` (268px at md) gutter on the layout, indenting the article
 * away from the header/tab left edge. Forcing `--fd-sidebar-width:0px` (important,
 * to beat the sidebar slot's `md:layout:[--fd-sidebar-width:268px]`) collapses that
 * gutter so the content aligns flush-left under the logo and tabs.
 *
 * The grid's own `--fd-layout-width` is left at the fumadocs default (97rem) — the
 * chrome (DocsHeader/DocsTabsBar) is pinned to the same 97rem so everything shares
 * one centered block. (Forcing a narrower 1400px here only enlarged the side
 * gutters, pushing the sidebar inward.)
 */
export function DocsShell({
  componentsTree,
  primitivesTree,
  shadersTree,
  iconsTree,
  children,
}: {
  componentsTree: Root;
  primitivesTree: Root;
  shadersTree: Root;
  iconsTree: Root;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = getActiveDocsTab(pathname);
  const isIcons = activeTab === "icons";
  const tree =
    activeTab === "primitives"
      ? primitivesTree
      : activeTab === "shaders"
        ? shadersTree
        : isIcons
          ? iconsTree
          : componentsTree;

  return (
    <DocsLayout
      tree={tree}
      {...baseOptions()}
      nav={{ enabled: false }}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: false }}
      sidebar={{ collapsible: false, enabled: !isIcons }}
      containerProps={{
        className: isIcons
          ? "[--fd-banner-height:2.75rem] [--fd-sidebar-width:0px]!"
          : "[--fd-banner-height:2.75rem]",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none -z-10 h-[360px] w-full self-start [grid-area:main] bg-grid-fade"
      />
      {children}
    </DocsLayout>
  );
}
