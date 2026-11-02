import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getSectionEntries, loadDocsSource } from "../data";
import { IndexSection, indexCard, indexCardLink } from "../index-section";

/** The command the Installation card previews. */
const INSTALL_EXAMPLE = "npx shadcn@latest add @remocn/soft-blur-in";

/**
 * "Start here": one numbered card per Getting Started page, titles and
 * descriptions read from the pages themselves.
 */
export async function StartHere({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const entries = getSectionEntries("/docs/getting-started");

  return (
    <IndexSection heading={children} count={entries.length}>
      <ol className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
        {entries.map((entry, index) => (
          <li key={entry.url}>
            <Link
              href={entry.url}
              className={cn(
                indexCard,
                indexCardLink,
                "flex h-full flex-col gap-2 p-5 sm:min-h-[140px]",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-ui leading-[22px] font-medium text-foreground">
                  {entry.title}
                </span>
                <span className="text-mono leading-4 text-subtle tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="line-clamp-3 text-small text-muted-foreground">
                {entry.description}
              </span>
              {entry.url.endsWith("/installation") && (
                <code className="mt-1 flex h-8 items-center overflow-hidden rounded-[10px] bg-surface-muted px-2.5 font-mono text-micro leading-4 whitespace-nowrap text-body">
                  {INSTALL_EXAMPLE}
                </code>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </IndexSection>
  );
}
