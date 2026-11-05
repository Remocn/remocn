"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { NewBadge } from "@/components/docs/new-badge";
import type { DocsTabId } from "@/lib/docs-tabs";
import { cn } from "@/lib/utils";
import { ChevronIcon, FilterIcon, GroupIcon } from "./docs-icons";
import type { SidebarGroup as Group, SidebarEntry } from "./sidebar-model";

/** Long categories show their first few pages and a "Show all" row. */
const PREVIEW = 7;
const TRUNCATE_OVER = 24;
/** Categories this big get a filter field when open. */
const FILTER_FROM = 10;

export type SidebarSize = "md" | "lg";

const ROW = {
  md: "h-[34px] gap-2.5 rounded-[10px] px-2.5 text-small",
  lg: "h-10 gap-2.5 text-[15px] leading-5 font-medium text-foreground",
};

const ITEM = {
  md: "h-8 pr-2.5 text-small",
  lg: "h-[38px] pr-2.5 text-[15px] leading-5",
};

function visibleEntries(
  entries: SidebarEntry[],
  query: string,
  expanded: boolean,
  activeUrl: string,
): { list: SidebarEntry[]; truncated: boolean } {
  const q = query.trim().toLowerCase();
  if (q) {
    return {
      list: entries.filter(
        (e) => e.kind === "page" && e.name.toLowerCase().includes(q),
      ),
      truncated: false,
    };
  }
  const pages = entries.filter((e) => e.kind === "page");
  const activeAt = pages.findIndex(
    (e) => e.kind === "page" && e.url === activeUrl,
  );
  if (expanded || pages.length <= TRUNCATE_OVER || activeAt >= PREVIEW) {
    return { list: entries, truncated: false };
  }
  const list: SidebarEntry[] = [];
  let shown = 0;
  for (const entry of entries) {
    if (shown === PREVIEW) break;
    list.push(entry);
    if (entry.kind === "page") shown++;
  }
  return { list, truncated: true };
}

function EntryRow({
  entry,
  activeUrl,
  size,
  plain,
  onNavigate,
}: {
  entry: SidebarEntry;
  activeUrl: string;
  size: SidebarSize;
  plain: boolean;
  onNavigate?: () => void;
}) {
  if (entry.kind === "label") {
    return (
      <span
        className={cn(
          "flex h-[30px] items-center text-caption text-subtle",
          plain ? "pl-9" : "border-l border-divider",
          !plain && (size === "md" ? "pl-[18px]" : "pl-3.5"),
        )}
      >
        {entry.name}
      </span>
    );
  }

  const active = entry.url === activeUrl;
  return (
    <Link
      href={entry.url}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex shrink-0 items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        ITEM[size],
        plain
          ? "rounded-[10px] pl-9 hover:bg-capsule"
          : active
            ? cn(
                "border-l-2 border-primary",
                size === "md" ? "pl-[17px]" : "pl-[13px]",
              )
            : cn(
                "rounded-r-tile border-l border-divider hover:bg-capsule",
                size === "md" ? "pl-[18px]" : "pl-3.5",
              ),
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="min-w-0 truncate">{entry.name}</span>
      {entry.isNew && <NewBadge />}
    </Link>
  );
}

/**
 * One sidebar category: the row (icon, name, "N new", count, chevron) and,
 * when open, its pages behind a hairline rail. The open category holding the
 * current page gets a filter field and, past `TRUNCATE_OVER` pages, shows
 * only the first `PREVIEW` with a "Show all" row.
 */
export function SidebarGroup({
  group,
  tab,
  activeUrl,
  size = "md",
  onNavigate,
}: {
  group: Group;
  tab: DocsTabId;
  activeUrl: string;
  size?: SidebarSize;
  onNavigate?: () => void;
}) {
  const containsActive =
    group.indexUrl === activeUrl ||
    group.entries.some((e) => e.kind === "page" && e.url === activeUrl);
  const pinned = group.pinned && size === "md";
  const [open, setOpen] = useState(containsActive || pinned);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const { list, truncated } = visibleEntries(
    group.entries,
    query,
    expanded,
    activeUrl,
  );
  const lit = open || containsActive;
  const plain = pinned && !containsActive;
  const pageCount = group.entries.filter((e) => e.kind === "page").length;
  const showFilter = open && pageCount >= FILTER_FROM;

  const head = (
    <>
      {size === "md" && (
        <GroupIcon
          tab={tab}
          group={group.id}
          className={cn(
            "size-4 shrink-0",
            lit || pinned ? "text-foreground" : "text-body",
          )}
        />
      )}
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-[7px]",
          size === "md" &&
            (lit || pinned ? "font-medium text-foreground" : "text-body"),
        )}
      >
        <span className="truncate">{group.name}</span>
        {group.newCount > 0 && <NewBadge count={group.newCount} />}
      </span>
      {(group.showCount || size === "lg") && (
        <span
          className={cn(
            "w-7 shrink-0 text-right tabular-nums",
            size === "md" ? "text-mono" : "text-caption",
            lit ? "text-muted-foreground" : "text-subtle",
          )}
        >
          {group.count}
        </span>
      )}
    </>
  );

  const chevron = (
    <ChevronIcon
      className={cn(
        "size-3.5 shrink-0",
        open && "rotate-90",
        lit ? "text-foreground" : "text-subtle",
      )}
    />
  );

  const toggle = () => setOpen((value) => !value);

  return (
    <div className={cn("flex flex-col", open && "gap-1 pb-1.5")}>
      {pinned ? (
        <div className={cn("flex items-center", ROW[size])}>{head}</div>
      ) : group.indexUrl ? (
        <div
          className={cn(
            "flex items-center",
            ROW[size],
            size === "md" && "hover:bg-capsule",
          )}
        >
          <Link
            href={group.indexUrl}
            onClick={() => {
              setOpen(true);
              onNavigate?.();
            }}
            aria-current={group.indexUrl === activeUrl ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-2.5 self-stretch rounded-tile outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {head}
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={listId}
            aria-label={`${open ? "Collapse" : "Expand"} ${group.name}`}
            className={cn(
              "relative flex size-3.5 shrink-0 items-center justify-center rounded-tag outline-none before:absolute before:rounded-tag before:content-[''] focus-visible:ring-2 focus-visible:ring-ring [&>svg]:relative",
              // The sheet's chevron gets a 44px touch target.
              size === "md"
                ? "before:-inset-[5px] hover:before:bg-secondary"
                : "before:-inset-[15px]",
            )}
          >
            {chevron}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "flex w-full items-center text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            ROW[size],
            size === "md" && "hover:bg-capsule",
          )}
        >
          {head}
          {chevron}
        </button>
      )}

      {open && (
        <div
          id={listId}
          className={cn(
            "flex flex-col gap-1.5",
            !plain && (size === "md" ? "pl-[17px]" : "pl-0.5"),
          )}
        >
          {showFilter && (
            <label className="flex h-8 shrink-0 items-center gap-2 rounded-[10px] border border-divider bg-surface px-2.5 focus-within:ring-2 focus-within:ring-ring">
              <FilterIcon className="size-3.5 shrink-0 text-subtle" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Filter ${pageCount} in ${group.name}`}
                aria-label={`Filter ${group.name}`}
                className={cn(
                  "min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle dark:placeholder:text-muted-foreground",
                  size === "md" ? "text-caption" : "text-base",
                )}
              />
            </label>
          )}
          <div className="flex flex-col">
            {list.map((entry, i) => (
              <EntryRow
                key={entry.kind === "page" ? entry.url : `${entry.name}-${i}`}
                entry={entry}
                activeUrl={activeUrl}
                size={size}
                plain={plain}
                onNavigate={onNavigate}
              />
            ))}
            {query && list.length === 0 && (
              <span className="flex h-8 items-center border-l border-divider pl-[18px] text-caption text-subtle">
                Nothing matches
              </span>
            )}
            {truncated && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-r-tile border-l border-divider pr-2.5 pl-[18px] text-left outline-none hover:bg-capsule focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="text-caption text-foreground">
                  Show all {group.count}
                </span>
                <span className="text-micro text-subtle dark:text-muted-foreground">
                  {group.count - PREVIEW} more
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
