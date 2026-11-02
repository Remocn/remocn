"use client";

import { useEffect, useRef } from "react";
import { AgentsLink } from "./agents-link";
import { LibrarySwitcher } from "./library-switcher";
import type { SidebarModel } from "./sidebar-model";
import { SidebarTree } from "./sidebar-tree";

/**
 * Desktop sidebar (`lg`+): library switcher (its label shows as a tooltip on
 * hover), the category tree and the agents link. Search lives on ⌘K. The
 * content sticks to the top; the switcher stays put, only the tree scrolls.
 */
export function DocsSidebar({
  model,
  activeUrl,
}: {
  model: SidebarModel;
  activeUrl: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // Bring the current page into view when the tree is longer than the screen.
  useEffect(() => {
    const el = scroller.current;
    const current = el?.querySelector<HTMLElement>(
      `a[href="${CSS.escape(activeUrl)}"]`,
    );
    if (!el || !current) return;
    const top =
      current.getBoundingClientRect().top -
      el.getBoundingClientRect().top +
      el.scrollTop;
    if (top > el.scrollTop + el.clientHeight - 80 || top < el.scrollTop) {
      el.scrollTop = top - el.clientHeight / 3;
    }
  }, [activeUrl]);

  return (
    <aside className="hidden w-(--docs-sidebar) shrink-0 lg:block">
      <div className="sticky top-0 flex h-svh flex-col pr-4">
        <div className="shrink-0 pt-6 pb-2">
          <LibrarySwitcher active={model.tab} />
        </div>
        <div
          ref={scroller}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pt-3 pb-10 [mask-image:linear-gradient(to_bottom,transparent,#000_12px)]"
        >
          <SidebarTree model={model} activeUrl={activeUrl} />
          <AgentsLink className="pt-2" />
        </div>
      </div>
    </aside>
  );
}
