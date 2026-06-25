"use client";

import { DocsSponsor } from "./docs-sponsor";

export function DocsAdRail() {
  return (
    <aside
      id="nd-toc"
      className="sticky top-(--fd-docs-row-1) flex h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] w-(--fd-toc-width) flex-col gap-4 overflow-y-auto [grid-area:toc] pt-12 ps-4 pe-4 pb-6 max-xl:hidden"
    >
      <DocsSponsor />
    </aside>
  );
}
