"use client";

import { useDocsShell } from "@/components/docs/docs-shell";
import { SidebarIcon } from "./docs-icons";
import type { Crumb } from "./page-context";

/**
 * Docs page bar below `lg`: the sections trigger (sidebar icon + section ›
 * page) that opens the sections sheet. Sticks to the top while reading.
 */
export function MobilePageBar({ crumbs }: { crumbs: Crumb[] }) {
  const { openSections } = useDocsShell();
  const page = crumbs.at(-1)?.label;
  const section = crumbs.length > 1 ? crumbs.at(-2)?.label : undefined;

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-hairline bg-surface-muted px-4 pt-2 pb-3 lg:hidden">
      <button
        type="button"
        onClick={openSections}
        aria-haspopup="dialog"
        className="relative flex h-[38px] min-w-0 items-center gap-1.5 rounded-control-sm bg-surface pr-3 pl-2.5 text-small leading-[18px] shadow-[0_0_0_1px_var(--color-hairline)] outline-none transition-colors hover:bg-surface/70 focus-visible:ring-2 focus-visible:ring-ring after:absolute after:-inset-y-1 after:inset-x-0 lg:hidden"
      >
        <SidebarIcon className="size-4 shrink-0 text-foreground" />
        <span className="sr-only">Docs sections:</span>
        {section && (
          <span className="min-w-0 truncate text-muted-foreground">
            {section}
          </span>
        )}
        <span className="max-w-[55vw] shrink-0 truncate font-medium text-foreground">
          {page}
        </span>
      </button>
    </div>
  );
}
