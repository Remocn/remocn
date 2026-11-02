"use client";

import { type ReactNode, useDeferredValue, useState } from "react";
import { ComponentCardGrid } from "@/components/docs/component-card-grid";
import type { DocEntry } from "../data";
import { FilterChip } from "../filter-chip";
import { FilterField } from "../filter-field";
import { IndexSection } from "../index-section";

export type BrowserEntry = DocEntry & { order: number };

export type BrowserGroup = {
  id: string;
  title: string;
  /** The group's MDX heading (+ lead), rendered on the server. */
  heading: ReactNode;
  entries: BrowserEntry[];
};

type Order = "sidebar" | "alphabetical";

const ORDERS: { value: Order; label: string }[] = [
  { value: "sidebar", label: "Sidebar order" },
  { value: "alphabetical", label: "A to Z" },
];

function matches(entry: DocEntry, query: string) {
  if (!query) return true;
  const haystack =
    `${entry.title} ${entry.description ?? ""} ${entry.url}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

function sortEntries(entries: BrowserEntry[], order: Order) {
  return [...entries].sort((a, b) =>
    order === "alphabetical"
      ? a.title.localeCompare(b.title)
      : a.order - b.order,
  );
}

/**
 * Client half of `CategoryIndex`: filter by text, narrow to one group with the
 * chips, switch between sidebar and alphabetical order. Groups left empty by
 * a filter disappear; counts follow the filter.
 */
export function CategoryBrowser({
  groups,
  noun,
}: {
  groups: BrowserGroup[];
  noun: string;
}) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("sidebar");
  const [active, setActive] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const total = new Set(groups.flatMap((g) => g.entries.map((e) => e.url)))
    .size;

  const visible = groups
    .filter((group) => !active || group.id === active)
    .map((group) => ({
      ...group,
      entries: sortEntries(
        group.entries.filter((entry) => matches(entry, deferredQuery)),
        order,
      ),
    }))
    .filter((group) => group.entries.length);
  const shown = new Set(
    visible.flatMap((group) => group.entries.map((entry) => entry.url)),
  ).size;

  return (
    <div className="not-prose mt-6 flex flex-col sm:mt-7" data-not-typeset>
      <div className="flex flex-col gap-2.5 sm:gap-3">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <FilterField
            aria-label={`Filter ${noun}`}
            placeholder={`Filter ${total} ${noun} by name or effect`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="relative flex h-11 w-fit shrink-0 items-center gap-2 rounded-control bg-secondary px-3.5 text-[15px] leading-5 text-foreground transition-colors focus-within:ring-3 focus-within:ring-ring hover:bg-[#dcdde0] dark:hover:bg-[#33363b]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0 fill-none stroke-foreground stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
            </svg>
            <span aria-hidden="true">
              {ORDERS.find((option) => option.value === order)?.label}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0 fill-none stroke-muted-foreground stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <select
              aria-label="Order"
              value={order}
              onChange={(event) => setOrder(event.target.value as Order)}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
            >
              {ORDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {groups.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pt-0">
            <FilterChip
              active={!active}
              count={total}
              leading="Aa"
              onClick={() => setActive(null)}
              className="max-sm:h-11 max-sm:rounded-control-sm"
            >
              All
            </FilterChip>
            {groups.map((group) => (
              <FilterChip
                key={group.id}
                active={active === group.id}
                count={group.entries.length}
                onClick={() =>
                  setActive((current) =>
                    current === group.id ? null : group.id,
                  )
                }
                className="max-sm:h-11 max-sm:rounded-control-sm max-sm:px-3.5"
              >
                {group.title}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {shown} of {total} {noun}
      </p>

      {visible.map((group) => (
        <IndexSection
          key={group.id}
          heading={group.heading}
          count={group.heading ? group.entries.length : undefined}
          className="mt-10 first:mt-10 sm:mt-12 sm:first:mt-12"
        >
          <ComponentCardGrid
            className="my-0"
            items={group.entries.map((entry) => ({
              name: entry.title,
              description: entry.description,
              status: "stable",
              href: entry.url,
              component: entry.component,
              isNew: entry.isNew,
            }))}
          />
        </IndexSection>
      ))}

      {!visible.length && (
        <p className="mt-10 rounded-card bg-surface px-5 py-8 text-center text-small text-muted-foreground shadow-[0_0_0_1px_var(--color-hairline)]">
          No {noun} match “{deferredQuery}”.
        </p>
      )}
    </div>
  );
}
