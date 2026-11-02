import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { loadDocsSource } from "../data";
import { IndexSection, indexCardLink } from "../index-section";
import { BLOCK_ART } from "./block-art";
import { getUiEntries, spacedTitle } from "./data";

/** "Blocks": every remocn-ui block with its own length from frontmatter. */
export async function UiBlocks({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const entries = getUiEntries("blocks");

  return (
    <IndexSection heading={children} count={entries.length}>
      <ul className="grid gap-3 pt-1 sm:grid-cols-2">
        {entries.map((entry) => {
          const art = BLOCK_ART[entry.slug];
          return (
            <li key={entry.slug}>
              <Link
                href={entry.url}
                className={cn(
                  "flex h-full flex-col rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)] p-1.5",
                  indexCardLink,
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-[168px] shrink-0 overflow-hidden rounded-control",
                    art?.bg ?? "bg-[#0e1012]",
                  )}
                >
                  {art?.art}
                </span>
                <span className="flex flex-col gap-1 px-2.5 pt-3 pb-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[15px] leading-5 font-medium text-foreground">
                      {spacedTitle(entry.title)}
                    </span>
                    {entry.length !== undefined && (
                      <span className="shrink-0 text-caption leading-4 text-muted-foreground">
                        {typeof entry.length === "number"
                          ? `${entry.length} frames`
                          : entry.length}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-caption leading-[18px] text-muted-foreground">
                    {entry.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </IndexSection>
  );
}
