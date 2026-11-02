"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FilterChip } from "../filter-chip";
import type { LibraryItem } from "./library-data";
import { type LibraryKind, TilePreview } from "./tile-preview";

/** Footage behind the caption tiles, cycled so neighbours differ. */
const CAPTION_PHOTOS = [1, 3, 5, 4, 6, 2].map((n) => `/reel/reel-${n}.jpg`);

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The "All shaders / filters / caption styles" grid: vibe chips (All first,
 * then by count) that narrow a grid of preview tiles. Each tile plays on hover.
 */
export function LibraryGrid({
  items,
  kind,
}: {
  items: LibraryItem[];
  kind: LibraryKind;
}) {
  const [vibe, setVibe] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Vibes by count, ties in the order they first appear in the sidebar.
  const vibes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.vibe) counts.set(item.vibe, (counts.get(item.vibe) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const shown = vibe ? items.filter((item) => item.vibe === vibe) : items;
  const wide = kind === "filter";

  const chip = (active: boolean) =>
    cn(
      "text-small leading-5 max-sm:h-11 max-sm:rounded-control-sm max-sm:px-3.5",
      !active && "bg-secondary hover:bg-[#dcdde0]",
    );

  return (
    <>
      <fieldset className="-mx-5 flex min-w-0 gap-2 overflow-x-auto border-0 px-5 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <legend className="sr-only">Filter by vibe</legend>
        <FilterChip
          active={vibe === null}
          count={items.length}
          onClick={() => setVibe(null)}
          className={chip(vibe === null)}
        >
          All
        </FilterChip>
        {vibes.map(([name, count]) => (
          <FilterChip
            key={name}
            active={vibe === name}
            count={count}
            onClick={() => setVibe(vibe === name ? null : name)}
            className={chip(vibe === name)}
          >
            {capitalize(name)}
          </FilterChip>
        ))}
      </fieldset>
      <ul
        className={cn(
          "grid grid-cols-2 gap-2.5 sm:gap-3.5",
          wide ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {shown.map((item) => (
          <li key={item.slug}>
            <Link
              href={item.url}
              onPointerEnter={() => setHovered(item.slug)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.slug)}
              onBlur={() => setHovered(null)}
              className="group/tile flex h-full flex-col rounded-capsule bg-surface px-[5px] pt-[5px] pb-3 shadow-[0_0_0_1px_var(--color-hairline)] outline-none transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--color-divider)] focus-visible:ring-3 focus-visible:ring-ring sm:rounded-cta sm:p-1.5"
            >
              <span
                className={cn(
                  "relative block overflow-hidden rounded-[13px] bg-dark-surface sm:rounded-[10px]",
                  wide ? "aspect-video" : "aspect-[222/140]",
                )}
              >
                {kind === "caption" && (
                  // biome-ignore lint/performance/noImgElement: decorative footage under a transparent player
                  <img
                    src={
                      CAPTION_PHOTOS[
                        items.indexOf(item) % CAPTION_PHOTOS.length
                      ]
                    }
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
                {kind === "caption" && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,#0e101240_0%,#0e1012b3_100%)]"
                  />
                )}
                <TilePreview
                  slug={item.slug}
                  kind={kind}
                  playing={hovered === item.slug}
                />
              </span>
              <span
                className={cn(
                  "flex flex-col gap-0.5 px-[7px] pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-2 sm:pt-0",
                  wide ? "sm:h-11" : "sm:h-10",
                )}
              >
                <span className="text-[15px] leading-5 font-medium text-foreground sm:text-small">
                  {item.title}
                </span>
                {item.vibe && (
                  <span className="text-caption leading-[18px] text-subtle sm:leading-4">
                    {item.vibe}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
