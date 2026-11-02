"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DOCS_TABS, getActiveDocsTab } from "@/lib/docs-tabs";
import type { PageNeighbour } from "./page-context";

/** Focus inside these owns its letter keys (typing, menu typeahead). */
const OWNS_KEYS =
  'input, textarea, select, [contenteditable], [role="menu"], [role="listbox"], [role="combobox"], [role="dialog"]';

/**
 * Vim-style docs navigation: `j` / `k` step to the next / previous page (the
 * arrows above the title), `h` / `l` to the previous / next library (the
 * sidebar switcher). Neither wraps around, matching the arrows' dead ends.
 */
export function KeyboardNav({
  previous,
  next,
}: {
  previous?: PageNeighbour;
  next?: PageNeighbour;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const tabIndex = DOCS_TABS.findIndex(
      (tab) => tab.id === getActiveDocsTab(pathname),
    );
    const targets: Record<string, string | undefined> = {
      j: next?.url,
      k: previous?.url,
      h: DOCS_TABS[tabIndex - 1]?.href,
      l: DOCS_TABS[tabIndex + 1]?.href,
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
        return;
      const href = targets[event.key];
      if (!href) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest(OWNS_KEYS)) return;
      event.preventDefault();
      router.push(href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, previous?.url, next?.url]);

  return null;
}
