import {
  HeaderActions,
  HeaderLogo,
} from "@/app/(home)/components/header-parts";
import { NavDesktop } from "@/app/(home)/components/header-nav";
import { NAV_LINKS } from "@/config/site";

/**
 * Static, content-aligned header for the docs. Unlike `SiteHeader` it never
 * sticks, never listens to scroll, and never morphs into a pill.
 *
 * The inner container mirrors Fumadocs' centered docs layout
 * (`--fd-layout-width`) and the logo cell is the width of the sidebar column
 * (`--fd-sidebar-width`), so the logo lands over the sidebar, the nav begins
 * exactly at the article column's left edge, and the actions sit at the content
 * block's right edge. The CSS vars are redeclared here because this header
 * renders above (outside) DocsLayout, so its variables aren't in scope. `-ml-4`
 * pulls the first nav item's label flush with the article text while its
 * ghost-button background bleeds back into the gutter.
 *
 * The 1400px / 268px literals mirror fumadocs-ui 16.7 defaults — the docs grid
 * sets `[--fd-layout-width:1400px]` and `md:layout:[--fd-sidebar-width:268px]`
 * (the non-collapsible sidebar column equals the sidebar width). They must stay
 * inline (Tailwind JIT can't read JS constants); if a fumadocs upgrade changes
 * those defaults, re-sync the two values below.
 */
export function DocsHeader() {
  return (
    <header className="relative z-40 h-16 w-full border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-(--fd-layout-width) items-center [--fd-layout-width:1400px] md:[--fd-sidebar-width:268px]">
        <div className="flex shrink-0 items-center px-4 md:w-(--fd-sidebar-width) md:px-0">
          <HeaderLogo />
        </div>
        <div className="flex flex-1 items-center justify-between px-4 md:px-6 xl:px-5">
          <NavDesktop links={NAV_LINKS} className="-ml-4" />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
