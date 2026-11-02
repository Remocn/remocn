import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { loadDocsSource } from "../data";
import { IndexSection, indexCardLink } from "../index-section";
import { COMPONENT_ART } from "./component-art";
import { getUiEntries } from "./data";

/**
 * "Components": every remocn-ui primitive. The ones named in `featured` get a
 * still preview tile, the rest follow as an alphabetical name grid.
 */
export async function UiComponents({
  featured,
  children,
}: {
  /** Registry names to show as preview tiles, in this order. */
  featured: string[];
  children: ReactNode;
}) {
  await loadDocsSource();
  const entries = getUiEntries("components");
  const tiles = featured
    .map((slug) => entries.find((entry) => entry.slug === slug))
    .filter((entry) => entry !== undefined);
  const rest = entries
    .filter((entry) => !featured.includes(entry.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <IndexSection heading={children} count={entries.length}>
      <ul className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4 sm:gap-3">
        {tiles.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={entry.url}
              className={cn(
                "flex h-full flex-col rounded-cta bg-surface shadow-[0_0_0_1px_var(--color-hairline)] p-1.5 sm:h-[202px]",
                indexCardLink,
              )}
            >
              <span
                aria-hidden="true"
                className="block h-[116px] shrink-0 overflow-hidden rounded-[10px] bg-surface-muted"
              >
                {COMPONENT_ART[entry.slug]}
              </span>
              <span className="flex flex-col gap-0.5 px-2 pt-2.5 pb-1">
                <span className="text-small font-medium text-foreground">
                  {entry.title}
                </span>
                <span className="line-clamp-3 text-mono leading-4 text-muted-foreground sm:line-clamp-2">
                  {entry.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-2">
          <p className="text-caption leading-4 text-muted-foreground">
            And {rest.length} more, alphabetical
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {rest.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={entry.url}
                  title={entry.title}
                  className="flex h-9 items-center rounded-[10px] border border-hairline bg-surface px-3 font-mono text-[13px] leading-4 text-foreground outline-none transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <span className="truncate">{entry.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </IndexSection>
  );
}
