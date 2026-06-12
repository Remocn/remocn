"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_TABS, getActiveDocsTab } from "@/lib/docs-tabs";
import { cn } from "@/lib/utils";

/**
 * Tab switcher for the docs: Components | Primitives. Rendered inside the thin
 * `DocsTabsBar` below the main header. The active tab is derived from the current
 * path (the ui section maps to Primitives, see {@link getActiveDocsTab}) and
 * carries an underline pinned to the bar's bottom border via `bottom-0`. The nav
 * stretches to its parent's height (no hardcoded height), so the underline tracks
 * whatever bar it sits in. Each tab is a plain link; switching navigates to that
 * tab's landing page and `DocsShell` swaps the sidebar tree for the new path.
 */
export function DocsTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = getActiveDocsTab(pathname);

  return (
    <nav className={cn("flex items-stretch gap-1", className)}>
      {DOCS_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center px-3 text-sm font-medium transition-colors focus-visible:text-foreground focus-visible:outline-none",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
