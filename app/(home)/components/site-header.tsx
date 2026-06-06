import { NAV_LINKS } from "@/config/site";
import { NavDesktop } from "./header-nav";
import { HeaderActions, HeaderLogo } from "./header-parts";
import { StickyHeaderShell } from "./sticky-header-shell";

export function SiteHeader() {
  return (
    <StickyHeaderShell>
      <HeaderLogo />
      <NavDesktop links={NAV_LINKS} />
      <HeaderActions />
    </StickyHeaderShell>
  );
}
