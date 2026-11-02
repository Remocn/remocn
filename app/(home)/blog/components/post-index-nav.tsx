"use client";

import { type ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useActiveSection } from "../../components/site-page/use-active-section";

export type PostHeading = { title: ReactNode; url: string; depth: number };

/**
 * Sticky "In this post" index beside the article, numbered like the legal
 * page; the heading being read is raised.
 */
export function PostIndexNav({ headings }: { headings: PostHeading[] }) {
  const ids = useMemo(
    () => headings.map((heading) => heading.url.replace(/^#/, "")),
    [headings],
  );
  const active = useActiveSection(ids);

  return (
    <nav
      aria-label="In this post"
      className="flex flex-col gap-1 rounded-card bg-surface-muted p-2"
    >
      <p className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <span className="text-[15px] leading-5 font-medium text-foreground">
          In this post
        </span>
        <span className="text-caption text-subtle tabular-nums">
          {headings.length}
        </span>
      </p>
      {headings.map((heading, index) => {
        const current = ids[index] === active;
        return (
          <a
            key={heading.url}
            href={heading.url}
            aria-current={current ? "location" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2.5 rounded-control-sm px-3.5 py-2.5 outline-none transition-[background-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring",
              current
                ? "bg-surface shadow-[0_0_0_1px_var(--hairline),0_1px_2px_#0e10120a] dark:bg-secondary dark:shadow-[inset_0_1px_0_#ffffff0f,0_0_0_1px_#ffffff0f]"
                : "hover:bg-surface/70 dark:hover:bg-secondary/60",
            )}
          >
            <span
              className={cn(
                "w-[22px] shrink-0 text-caption tabular-nums",
                current ? "text-primary" : "text-subtle",
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-[15px] leading-5",
                current ? "text-primary" : "text-body",
              )}
            >
              {heading.title}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
