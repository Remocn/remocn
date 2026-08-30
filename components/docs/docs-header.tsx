import { NavDesktop } from "@/app/(home)/components/header-nav";
import {
  HeaderActions,
  HeaderLogo,
} from "@/app/(home)/components/header-parts";
import { NAV_LINKS } from "@/config/site";

/**
 * Static, content-aligned header for the docs. Unlike `SiteHeader` it never
 * sticks, never listens to scroll, and never morphs into a pill.
 *
 * The inner container mirrors Fumadocs' docs grid cell for cell so the header
 * chrome shares one vertical with the content below: the logo cell is the
 * sidebar column (`--fd-sidebar-width`), the right actions cell is the TOC
 * column (`--fd-toc-width`, xl+ only, like the rail itself), and the middle
 * cell reproduces the page block between them — `max-w-[900px] mx-auto` with
 * the page's own px-4/md:px-6/xl:px-8 — so the nav's first label starts on the
 * article title's left edge at every viewport. Below xl the TOC cell is gone
 * and the actions render inside the middle block, on the article's right edge.
 * The CSS vars are redeclared here because this header renders above (outside)
 * DocsLayout, so its variables aren't in scope. The logo cell keeps `px-4` at
 * every breakpoint so the logo lands at 16px — flush with the sidebar content's
 * `p-4` and the tab labels below it. `-ml-4` pulls the first nav item's label
 * flush with the article text while its ghost-button background bleeds back
 * into the gutter. The Components/Primitives switcher lives in the thin
 * `DocsTabsBar` rendered directly below this header.
 *
 * The 97rem / 268px / 900px literals mirror fumadocs-ui 16.7 grid defaults —
 * `var(--fd-layout-width, 97rem)`, `md:layout:[--fd-sidebar-width:268px]`,
 * `xl:layout:[--fd-toc-width:268px]`, and the page's `max-w-[900px]`. They must
 * stay inline (Tailwind JIT can't read JS constants); if a fumadocs upgrade
 * changes those defaults, re-sync the values below.
 */
export function DocsHeader() {
  return (
    <header className="relative z-40 h-16 w-full border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-(--fd-layout-width) items-center [--fd-layout-width:97rem] md:[--fd-sidebar-width:268px] xl:[--fd-toc-width:268px]">
        <div className="flex shrink-0 items-center px-6 md:w-(--fd-sidebar-width)">
          <HeaderLogo />
        </div>
        <div className="flex min-w-0 flex-1 items-center">
          <div className="mx-auto flex w-full max-w-[900px] items-center justify-between px-4 md:px-6 xl:px-8">
            <NavDesktop links={NAV_LINKS} className="-ml-4" />
            <div className="xl:hidden">
              <HeaderActions />
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 items-center justify-end pe-4 xl:flex xl:w-(--fd-toc-width)">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
