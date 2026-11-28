"use client";

import { useOpenPanel } from "@openpanel/nextjs";
import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SearchItemType,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useEffect, useMemo, useRef } from "react";
import { browserActor } from "@/lib/search/analytics-shape";
import { SearchDialogSession } from "@/lib/search/dialog-session";
import { splitSegmentRows } from "@/lib/search/docs-merge";

/**
 * The docs search dialog: the stock fumadocs dialog, composed from the same
 * parts, plus analytics on what people search for and whether they open a
 * result (`SearchDialogSession` holds the rules). A query that asks for
 * several things gets its components in groups, each under the part of the
 * query it answers.
 */
export default function DocsSearchDialog({ open, onOpenChange }: SharedProps) {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({ type: "fetch", locale });
  const op = useOpenPanel();

  const session = useRef<SearchDialogSession | null>(null);
  if (!session.current) {
    session.current = new SearchDialogSession(
      (event, properties) => op.track(event, properties),
      typeof navigator === "undefined"
        ? "human"
        : browserActor(navigator.userAgent, navigator.webdriver === true),
    );
  }

  const results = query.data === "empty" ? null : query.data;
  const { items, headings } = useMemo(
    () => splitSegmentRows(results ?? []),
    [results],
  );
  // `search` runs ahead of `results` while a request is in flight, so results
  // are only attributed to a query once they are the answer to it.
  const settled = !query.isLoading && results != null;
  useEffect(() => {
    if (settled && results) session.current?.results(search, results);
  }, [settled, results, search]);

  return (
    <SearchDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        // Selecting a result closes the dialog first and reports the
        // selection second; wait a tick so the close sees it.
        if (!next) setTimeout(() => session.current?.close(), 0);
      }}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      onSelect={(item: SearchItemType) => {
        if (item.type !== "action") session.current?.select(item);
      }}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={results ? items : null}
          Item={({ item, onClick }) => {
            const heading = headings.get(item.id);
            return (
              <>
                {heading && (
                  <div
                    data-search-segment=""
                    className="shrink-0 truncate px-2.5 pt-3 pb-1 font-medium text-fd-foreground/70 text-xs"
                  >
                    {heading}
                  </div>
                )}
                <SearchDialogListItem
                  item={item}
                  onClick={onClick}
                  // Keyboard navigation scrolls the row into view; the
                  // margin keeps its group label in view with it.
                  className={heading ? "scroll-mt-9" : undefined}
                />
              </>
            );
          }}
        />
      </SearchDialogContent>
    </SearchDialog>
  );
}
