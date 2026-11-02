import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getSeparatedGroups, loadDocsSource } from "../data";
import { IndexSection, indexCard } from "../index-section";

/**
 * "The practices": the guides section's "Practices" group as one list card,
 * title column + description, in sidebar order.
 */
export async function GuidePractices({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const practices =
    getSeparatedGroups("/docs/guides").find(
      (group) => group.title === "Practices",
    )?.entries ?? [];

  return (
    <IndexSection
      heading={children}
      count={practices.length}
      className="mt-8 sm:mt-12"
    >
      <ul className={cn(indexCard, "flex flex-col p-1.5")}>
        {practices.map((entry) => (
          <li key={entry.url}>
            <Link
              href={entry.url}
              className="flex items-center gap-3 rounded-control py-3 pr-3 pl-3.5 outline-none transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring sm:min-h-[68px] sm:gap-4 sm:px-3.5"
            >
              <span className="flex min-w-0 grow flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-[15px] leading-5 font-medium text-foreground sm:w-[220px] sm:shrink-0">
                  {entry.title}
                </span>
                <span className="text-small text-muted-foreground sm:line-clamp-2">
                  {entry.description}
                </span>
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0 fill-none stroke-subtle-line stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </IndexSection>
  );
}
