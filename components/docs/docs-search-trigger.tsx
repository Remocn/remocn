"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { cn } from "@/lib/utils";
import { SearchIcon } from "./shell/docs-icons";

/**
 * "Search docs ⌘K" capsule at the top of the sidebar. Opens the fumadocs
 * search dialog (the hotkey itself is bound by `RootProvider`).
 */
export function DocsSearchTrigger({
  className,
  onOpen,
}: {
  className?: string;
  /** Runs before the dialog opens (the mobile sheet closes itself). */
  onOpen?: () => void;
}) {
  const { enabled, setOpenSearch } = useSearchContext();
  if (!enabled) return null;

  return (
    <button
      type="button"
      data-search-full=""
      onClick={() => {
        onOpen?.();
        setOpenSearch(true);
      }}
      className={cn(
        "flex h-10 w-full shrink-0 items-center gap-2.5 rounded-control-sm bg-capsule pr-2 pl-3 text-left text-small text-muted-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="flex-1">Search docs</span>
      <kbd className="flex h-6 items-center rounded-tag border border-divider bg-surface px-[7px] font-sans text-micro text-muted-foreground pointer-coarse:hidden">
        ⌘K
      </kbd>
    </button>
  );
}
