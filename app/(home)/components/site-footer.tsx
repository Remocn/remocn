import { FOOTER_NAV } from "@/config/site";
import { NavFooter } from "./header-nav";

export function SiteFooter() {
  return (
    <div className="section">
      <footer className="flex flex-col items-start justify-between gap-4 border-t border-border pt-8 pb-12 text-sm text-muted-foreground md:flex-row md:items-center">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} remocn — MIT licensed
        </span>
        <NavFooter links={FOOTER_NAV} />
      </footer>
    </div>
  );
}
