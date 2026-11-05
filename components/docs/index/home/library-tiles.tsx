import Link from "next/link";
import type { ReactNode } from "react";
import type { DocsTabId } from "@/lib/docs-tabs";
import { cn } from "@/lib/utils";
import { getLibraries, loadDocsSource } from "../data";
import { IndexSection, indexCardLink } from "../index-section";

const ICON_PATHS = [
  "M22 12h-4l-3 9L9 3l-3 9H2",
  "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0",
  "M12 20V10M18 20V4M6 20v-4",
  "M5 12h14M12 5l7 7-7 7",
  "M6 8a6 6 0 1 0 12 0A6 6 0 1 0 6 8M15.5 13.5 17 22l-5-3-5 3 1.5-8.5",
];

/** Still artwork for each library tile (decoration only). */
const ART: Partial<Record<DocsTabId, ReactNode>> = {
  primitives: (
    <span className="flex size-full flex-col items-center justify-center gap-2 bg-surface-muted">
      <span className="flex h-[22px] w-10 items-center justify-end rounded-full bg-foreground p-[3px]">
        <span className="size-4 rounded-full bg-surface" />
      </span>
      <span className="flex h-[22px] items-center rounded-[7px] bg-secondary px-2 text-micro leading-[14px] text-foreground">
        Button
      </span>
    </span>
  ),
  shaders: (
    <span className="block size-full bg-[url(/landing/shader-violet.png)] bg-cover bg-[30%_50%]" />
  ),
  filters: (
    <span className="relative block size-full bg-dark-surface">
      <span className="absolute inset-0 bg-[url(/reel/reel-2.jpg)] bg-cover bg-center grayscale-100 contrast-140" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_farthest-corner_at_50%_50%,#0e101200_45%,#0e1012bf_100%)]" />
      <span className="absolute inset-x-0 top-[38px] h-2.5 bg-[#fafafa2e]" />
      <span className="absolute inset-x-0 top-14 h-[3px] bg-[#fafafa1f]" />
    </span>
  ),
  captions: (
    <span className="flex size-full flex-col items-center justify-end gap-0.5 bg-dark-surface pb-4 text-caption leading-4 font-semibold">
      <span className="text-[#fafafa8c]">in sync with</span>
      <span className="flex items-baseline gap-1 text-[#fafafa]">
        a real
        <span className="rounded-[4px] bg-primary-soft px-1 text-[#0e1012]">
          voice
        </span>
      </span>
    </span>
  ),
  icons: (
    <span className="flex size-full flex-wrap content-center justify-center gap-x-3.5 gap-y-3 bg-surface-muted px-3.5">
      {ICON_PATHS.map((d) => (
        <svg
          key={d}
          viewBox="0 0 24 24"
          className="size-5 fill-none stroke-foreground stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d={d} />
        </svg>
      ))}
    </span>
  ),
};

/**
 * "Libraries": one tile per library tab of the sidebar switcher, with its
 * component count. Scrolls sideways on narrow screens.
 */
export async function LibraryTiles({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const libraries = getLibraries();

  return (
    <IndexSection heading={children} count={libraries.length}>
      <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 py-px [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3.5 sm:overflow-visible sm:px-0">
        {libraries.map((library) => (
          <li key={library.id} className="w-[136px] shrink-0 sm:w-auto">
            <Link
              href={library.href}
              className={cn(
                "flex flex-col rounded-cta bg-surface p-1.5 shadow-[0_0_0_1px_var(--color-hairline)]",
                indexCardLink,
              )}
            >
              <span
                aria-hidden="true"
                className="block h-24 overflow-hidden rounded-[10px]"
              >
                {ART[library.id]}
              </span>
              <span className="flex items-baseline justify-between gap-2 px-1.5 pt-2.5 pb-1">
                <span className="text-small leading-[18px] font-medium text-foreground">
                  {library.label}
                </span>
                <span className="text-mono leading-4 text-subtle tabular-nums">
                  {library.count}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </IndexSection>
  );
}
