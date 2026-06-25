import { DocsTabs } from "@/components/docs/docs-tabs";

/**
 * Thin secondary bar sitting directly below {@link DocsHeader}, holding the
 * Components | Primitives switcher. It is `sticky top-0` so it stays pinned to
 * the top while the page scrolls; the (non-sticky) main header scrolls away
 * above it, and the bar pins exactly as the header scrolls out. `DocsShell` sets
 * the DocsLayout `--fd-banner-height` to this bar's height so the sticky sidebar
 * lands just below the pinned bar instead of under it.
 *
 * The tabs sit at the far left, aligned with the sidebar's content padding: the
 * centered block carries `px-4` (the sidebar's `p-4` = 16px) and `-ml-3` cancels
 * the first tab's own `px-3` so its label lands flush at 16px — directly above
 * the sidebar content's left edge. `items-stretch` lets the tabs fill the bar's
 * height so the active underline lands on its bottom border.
 *
 * The 97rem literal mirrors fumadocs-ui 16.7's docs-grid default
 * (`var(--fd-layout-width, 97rem)`), so this bar shares the same centered block
 * as the docs content and `DocsHeader` (Tailwind JIT can't read JS constants).
 */
export function DocsTabsBar() {
  return (
    <div className="sticky top-0 z-30 h-11 w-full border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-11 w-full max-w-(--fd-layout-width) items-stretch px-4 [--fd-layout-width:97rem]">
        <DocsTabs className="-ml-3" />
      </div>
    </div>
  );
}
