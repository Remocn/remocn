"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type BlogPostSummary,
  POST_KIND_LABEL,
  type PostKind,
} from "../lib/post-types";
import { GuideCard } from "./guide-card";
import { PostCard } from "./post-card";

type Filter = "all" | PostKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All posts" },
  { id: "launch", label: `${POST_KIND_LABEL.launch}s` },
  { id: "product", label: POST_KIND_LABEL.product },
];

/**
 * Everything but the featured post: a kind filter, the two newest as large
 * cards, the rest in a three-column grid closed by the guide card.
 */
export function PostIndex({
  posts,
  counts,
}: {
  posts: BlogPostSummary[];
  /** Totals per filter, featured post included. */
  counts: Record<Filter, number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown =
    filter === "all" ? posts : posts.filter((post) => post.kind === filter);
  const large = shown.slice(0, 2);
  const rest = shown.slice(2);

  return (
    <section
      aria-label="All posts"
      className="landing-container flex flex-col gap-8 pt-14 pb-[72px] md:gap-10 md:pt-0 xl:pb-section"
    >
      <div className="border-b border-divider pb-4 md:pb-5">
        <fieldset
          aria-label="Filter posts"
          className="-mx-5 flex min-w-0 gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0"
        >
          {FILTERS.map((item) => {
            const active = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-control-sm px-3.5 text-[15px] leading-5 outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring md:h-[34px] md:rounded-[10px] md:px-3",
                  active
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground hover:bg-[#dcdde0] dark:hover:bg-[#33363b]",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "text-caption tabular-nums",
                    active ? "text-background/65" : "text-muted-foreground",
                  )}
                >
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </fieldset>
      </div>

      {large.length > 0 && (
        <div className="grid gap-8 md:grid-cols-2">
          {large.map((post) => (
            <PostCard key={post.slug} post={post} size="lg" />
          ))}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 md:gap-y-14 md:pt-6 xl:grid-cols-3">
        {rest.map((post) => (
          <PostCard key={post.slug} post={post} size="sm" />
        ))}
        <GuideCard />
      </div>
    </section>
  );
}
