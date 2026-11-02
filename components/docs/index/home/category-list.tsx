import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getCategories, loadDocsSource } from "../data";
import { IndexSection, indexCard } from "../index-section";
import { NewTag } from "../new-tag";

/**
 * "Components": every component category with its sidebar icon, description,
 * component count and "new" tag, in sidebar order.
 */
export async function CategoryList({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const categories = getCategories();

  return (
    <IndexSection heading={children} count={categories.length}>
      <ul className={cn(indexCard, "flex flex-col p-1 sm:p-1.5")}>
        {categories.map((category) => (
          <li key={category.url}>
            <Link
              href={category.url}
              className="group/row flex min-h-[68px] items-center gap-3.5 rounded-control px-3 py-3 outline-none transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-body transition-colors group-hover/row:bg-surface [&_svg]:size-4"
              >
                {category.icon ?? <FallbackIcon />}
              </span>
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] leading-5 font-medium text-foreground">
                    {category.title}
                  </span>
                  {category.newLabel && <NewTag>{category.newLabel}</NewTag>}
                </span>
                {category.description && (
                  <span className="text-caption leading-[18px] text-muted-foreground">
                    {category.description}
                  </span>
                )}
              </span>
              <span className="w-8 shrink-0 text-right text-mono leading-4 text-subtle tabular-nums">
                {category.count}
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

/** For a section whose meta.json sets no icon. */
function FallbackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </svg>
  );
}
