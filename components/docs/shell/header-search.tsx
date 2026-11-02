"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { SearchIcon } from "./docs-icons";

/**
 * "Search" capsule that takes Get started's place in the docs header on
 * phones and tablets, where the sidebar's search field is tucked away.
 */
export function HeaderSearch() {
  const { enabled, setOpenSearch } = useSearchContext();
  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className="flex h-11 items-center gap-2 rounded-control bg-capsule px-3.5 outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SearchIcon className="size-4 shrink-0 text-foreground" />
      <span className="text-[15px] leading-[18px] text-muted-foreground">
        Search
      </span>
    </button>
  );
}
