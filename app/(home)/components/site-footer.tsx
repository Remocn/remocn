import { FOOTER_NAV, SUPPORT_EMAIL } from "@/config/site";
import { NavFooter } from "./header-nav";

export function SiteFooter() {
  return (
    <div className="section">
      <footer className="flex flex-col items-start justify-between gap-4 border-t border-border pt-8 pb-12 text-sm text-muted-foreground md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} remocn — MIT licensed
          </span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="w-fit transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <NavFooter links={FOOTER_NAV} />
      </footer>
    </div>
  );
}
