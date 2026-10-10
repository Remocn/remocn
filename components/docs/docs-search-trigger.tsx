"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

export function DocsSearchTrigger({
  count,
  hideIfDisabled,
}: {
  count: number;
  hideIfDisabled?: boolean;
}) {
  const { enabled, setOpenSearch } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;

  return (
    <button
      type="button"
      data-search-full=""
      aria-label="Open Search"
      onClick={() => setOpenSearch(true)}
      className="inline-flex h-9 w-full items-center gap-2 rounded-xl bg-muted px-3 text-sm font-medium text-muted-foreground control-surface control-surface-interactive outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Search className="size-4" />
      Search
      <span className="ms-auto text-xs tabular-nums text-muted-foreground/70">
        {count} components
      </span>
    </button>
  );
}
